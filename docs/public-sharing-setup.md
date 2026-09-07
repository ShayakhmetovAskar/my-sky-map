# Публичный эндпоинт шаринга — настройка (APO-88)

Что делает код и что владелец ставит руками. Дизайн: `docs/my-sky-collections-sharing.md` §4–5.

```
POST   /api/v1/me/collections/{id}/share    -> {"token": "..."}   идемпотентен
DELETE /api/v1/me/collections/{id}/share    -> 204                отзыв
GET    /api/v1/public/sky/{token}           -> {title, images}    без auth
```

Ссылку собирает фронт: `{location.origin}/s/{token}`. API не знает публичного хоста и
не должен — `PUBLIC_APP_ORIGIN` намеренно не заводили.

## Что уже в коде

- **Токен** — `secrets.token_urlsafe(16)`, 128 бит, 22 url-safe символа. Хранится
  открытым текстом в `collections.share_token` (ссылку показывают повторно, от дампа БД
  хэш не спасёт), частичный уникальный индекс `uq_collections_share_token`.
- **Единый 404.** Невалидный по форме, неизвестный, отозванный и истёкший токены дают
  один и тот же ответ. Форма проверяется регэкспом `^[A-Za-z0-9_-]{22}$` **до** запроса в
  БД: перебор случайных путей не доходит до базы.
- **Заголовки** `Cache-Control: no-store` и `X-Robots-Tag: noindex, nofollow` ставит класс
  маршрута `PrivateRoute` (`app/routers/public.py`) — на всех ответах роутера, включая 404.
  Внутри хендлера их бы получила только двухсотка, а кэшировать нельзя как раз 404 после отзыва.
- **Whitelist.** Ответ строится из общей с `/me/sky` схемы `SkyImage` (`app/schemas/sky.py`)
  и вторым слоем фильтруется `response_model`. Нет `user_id`, `submission_id`, `object_key`,
  `filename`, presigned-ссылок; снимки со статусом `failed` не отдаются.
- **Логи.** `args: ["--no-access-log"]` в `k8s/base/solver-api/deployment.yaml`: токен лежит
  в path, access-лог сделал бы из логов рабочий список всех расшаренных коллекций.
  Воркеру флаг не нужен — он не поднимает HTTP-сервер, а крутит поллинг БД.
- **Dev-nginx.** `nginx/conf.dev.d/default.conf` — один `location /api/v1/` вместо location
  на роутер, иначе каждый новый роутер молча 404-ит в dev.

## Руками: Cloudflare Rate Limiting

Ниже Cloudflare реального IP не видно (цепочка Cloudflare → NLB → ingress-nginx, `proxy-real-ip-cidr`
не настроен), поэтому лимит ставится на границе. Владелец создаёт правило сам — в репозитории
его нет.

**Dashboard → Security → WAF → Rate limiting rules → Create rule**

| Поле | Значение |
|---|---|
| Rule name | `public-sky-and-guest-auth` |
| If incoming requests match | `(http.request.uri.path contains "/api/v1/public/") or (http.request.uri.path eq "/api/v1/auth/guest")` |
| Characteristics | `IP` |
| Rate | `60` requests per `1 minute` |
| Action | `Block`, response `429` |
| Duration | `10 seconds` |

Или через API (`ZONE_ID`, токен с правами `Zone.WAF`):

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "description": "public-sky-and-guest-auth",
    "expression": "(http.request.uri.path contains \"/api/v1/public/\") or (http.request.uri.path eq \"/api/v1/auth/guest\")",
    "action": "block",
    "ratelimit": {
      "characteristics": ["ip.src", "cf.colo.id"],
      "period": 60,
      "requests_per_period": 60,
      "mitigation_timeout": 10
    },
    "action_parameters": {"response": {"status_code": 429,
      "content": "{\"error\":{\"code\":\"rate_limited\",\"message\":\"Too many requests\"}}",
      "content_type": "application/json"}}
  }'
```

Замечания:

- 60/мин/IP — это про abuse, а не про перебор токенов: 128 бит не перебираются и при
  миллиарде попыток в секунду. Правило гасит скан и защищает БД от мусорной нагрузки.
- `/api/v1/auth/guest` попадает в то же правило: создание гостя дороже (два вызова Zitadel),
  а in-memory лимитер в `routers/auth_guest.py` (APO-40) не переживает рестарт и не общий
  на реплики — он остаётся dev-фолбэком.
- Эскалации по 404 нет: и владелец с опечаткой в ссылке, и сканер получают одно и то же.
- Один тайл — не `/api/v1/*`, а бакет через CDN. Под правило не попадает и не должен:
  60/мин срезало бы обычный просмотр (десятки тайлов на кадр).

**Проверка после установки:**

```bash
TOKEN=<любой невалидный>
for i in $(seq 1 70); do
  curl -s -o /dev/null -w "%{http_code} " "https://<host>/api/v1/public/sky/$TOKEN"
done
# ожидаем: 404 ×60, затем 429
```

## Чеклист после деплоя

```bash
# 1. Заголовки есть и на 200, и на 404
curl -sI "https://<host>/api/v1/public/sky/AAAAAAAAAAAAAAAAAAAAAA" | grep -iE "cache-control|x-robots-tag"
#   -> Cache-Control: no-store
#   -> X-Robots-Tag: noindex, nofollow

# 2. Эндпоинт не требует auth (и не 401)
curl -s -o /dev/null -w "%{http_code}\n" "https://<host>/api/v1/public/sky/<валидный токен>"   # 200

# 3. Отзыв убивает ссылку сразу
#   DELETE /me/collections/{id}/share -> тот же GET отдаёт 404

# 4. В access-логах пода нет строк с путями (флаг применился)
kubectl -n skymap logs deploy/solver-api | grep -c "GET /public"   # 0
```

## Осталось за пределами APO-88

- **Ротация секретов снимков при отзыве** — сделано в APO-92: `DELETE /share` отдаёт 204 сразу,
  а в `BackgroundTasks` вызывает `rotate_image_secrets` для снимков коллекции, которых нет ни в
  одной другой коллекции с непустым `share_token`. Best-effort: сбой бакета не мешает отзыву,
  снимок просто остаётся на старом префиксе. Уже скачанные зрителем тайлы живут в его кэше
  до суток (`Cache-Control: public, max-age=86400`) — принято, дизайн §5.
- **Удаление расшаренной коллекции целиком** (`DELETE /me/collections/{id}`) секреты не ротирует:
  ссылка умирает вместе со строкой, но старые URL тайлов остаются живыми. Дизайн §5 говорит
  только про `DELETE /share`; закрывать — вместе с APO-93 (cleanup).
- **`expires_at` у гостей** ставится через `get_is_guest` (`app/dependencies.py`), который
  сейчас всегда `False`: гостевой авторизации (APO-40) на этой ветке нет. Когда APO-40
  вольётся — научить распознавать shadow-аккаунт надо ровно в этой функции.
- **`X-Robots-Tag` на `/s/` и `Referrer-Policy`** — E1 (APO-90) плюс per-location в nginx
  после выбора хостинга фронта.
