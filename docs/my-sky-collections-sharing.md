# My Sky: коллекции и шаринг по ссылке (APO-79)

## 1. TL;DR

- Снимки группируются в коллекции (M:N); коллекцией делятся capability-URL `/s/{token}` — «anyone with the link», как Google Photos.
- Токен: 128 бит CSPRNG (`secrets.token_urlsafe(16)`) в path, plaintext в `collections.share_token`. Тумблер off → NULL, on → новый токен.
- `GET /api/v1/public/sky/{token}` без auth отдаёт whitelist-payload в формате `/me/sky`; зритель не получает guest-токен APO-40.
- Тайлы и thumb — под секретом **на снимок** (`img/{image_secret}/…`) в `tasks.result.hips.base`. Удаление снимка синхронно чистит префиксы; Stop sharing ротирует секреты без перенарезки.
- Предпосылки: APO-81 → 83 → 84 → 85. v1 без паролей, per-collection OG, view_count, обложек, drag-order, mobile.

## 2. Как это делают в индустрии

Google Photos: тумблер link sharing (off→on = новая ссылка), Copy, без Reset/Preview — берём как есть. YouTube unlisted / gist: capability URL, 128 бит, токен ≠ id. Flickr/Notion/Dropbox: expiry, пароли, несколько ссылок — не v1, закладываем хук `expires_at`. AstroBin: M:N, снимки приватны, публичность только через коллекцию. ESASky/Aladin: вид неба в query — `?ra&dec&fov&img&tour=1` поверх `/s/{token}`.

OWASP: случайный id — не контроль доступа, каждый запрос проверяет, что ссылка жива. Токен в path: query режут кэш-ключи и аналитика (в логах path и query видны одинаково), fragment ломает серверную логику.

Ссылки: [W3C TAG](https://w3ctag.github.io/capability-urls/), [OWASP IDOR](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html), [Google Photos](https://support.google.com/photos/answer/9789702?hl=en), [YouTube unlisted](https://blog.youtube/news-and-events/update-youtube-unlisted-links/), [AstroBin](https://welcome.astrobin.com/features/image-collections), [ESASky](https://www.cosmos.esa.int/web/esdc/esasky-url-parameters).

## 3. Модель данных

```
collections: id uuid PK · user_id text (Zitadel sub) · title varchar(80)
  · share_token varchar(32) NULL · expires_at timestamptz NULL · created_at, updated_at
  INDEX (user_id) · UNIQUE (share_token) WHERE share_token IS NOT NULL
collection_items: collection_id FK collections CASCADE · task_id FK tasks CASCADE · position int
  PK (collection_id, task_id) · INDEX (task_id)
```

- Порядок = `position` (индекс массива в `PATCH`); при добавлении фронт вставляет по `date`.
- Метаданные (`kmax/moc/corners/base/thumb`) — в `tasks.result.hips` (APO-83/84), отдельной таблицы нет. `image_secret = token_urlsafe(16)` генерит воркер при тайлинге, живёт только в `result.hips.base`: `img/{image_secret}/Norder{k}/Npix{p}.png`, `thumb.jpg`. `user_sky` из APO-83 убирается. Статус: `result.hips` → `ready`; `tasks.status = tiling` → `tiling`; `completed` без `hips` → `failed`.
- `expires_at` только для гостей: `share + 30 дн.`, продлевается любым авторизованным запросом владельца к `/me/collections`.
- Удаление: `DELETE /submissions/{id}` до commit читает `result.hips.base` и синхронно чистит `img/{secret}/` и `users/{sub}/submissions/{id}/` (`list_objects` + `remove_objects`, 30–150 объектов; ошибка S3 → 503, БД не трогаем).
- Лимиты: ≤50 коллекций, ≤200 снимков, title 1–80. `down_revision` = head на момент миграции.

## 4. API

Владелец — `routers/collections.py`, `Depends(get_current_user)`, фильтр по `user_id` + 404:

| Метод и путь | Поведение |
|---|---|
| `GET /me/collections` | список с `items`, `share_token`, `expires_at` |
| `POST /me/collections {title}` | 201; 422 при лимите |
| `PATCH …/{id} {title?, items?}` | `items` — полный список в порядке массива; одним `SELECT … WHERE id = ANY(:ids) AND user_id = :uid AND (status = 'tiling' OR result ? 'hips')`, несовпадение → 404 |
| `DELETE …/{id}` | 204 |
| `POST …/share` | Идемпотентен: есть токен → возвращает его. `{token}`; URL собирает фронт из `location.origin` |
| `DELETE …/share` | 204, `share_token = NULL`, затем ротация секретов (§5). Reset = DELETE + POST |

Публичный — `routers/public.py`, без auth: `GET /api/v1/public/sky/{token}` → `{title, images: [SkyImage]}`, `SkyImage = {id, title, date, ra, dec, fov, pixscale, orientation, kmax, corners, moc, base, thumb, width, height, status}`.

- `SkyImage` — общая pydantic-схема с `/me/sky`, whitelist: без `user_id`, `submission_id`, `object_key`, `filename`, presigned URL; `failed` не отдаётся; тест на whitelist и отсутствие `filename` в любом поле. `title` = пользовательское, иначе из координат/даты («22h10m +12°10′ · 2026-09-03»); `date` = дата загрузки.
- Токен не по `^[A-Za-z0-9_-]{22}$` → 404 без БД; неизвестен/отозван/истёк → тот же 404. `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`.
- Rate limit. Цепочка — Cloudflare → NLB → ingress-nginx → uvicorn; ALB нет, ниже Cloudflare реального IP не видно (нет `proxy-real-ip-cidr`). v1: Cloudflare Rate Limiting rule на `/api/v1/public/*` и `/api/v1/auth/guest` — 60/мин/IP → 429. Альтернатива на ingress: `proxy-real-ip-cidr` = диапазоны Cloudflare + отдельный Ingress с `limit-rpm`. Эскалации по 404 нет. Dev-nginx: один `location /api/v1/`.

## 5. Модель безопасности ссылок

- **Энтропия и хранение.** 128 бит неперебираемы; plaintext — ссылку показывают повторно, от дампа БД хэш не спасает.
- **Отзыв.** Проверка на каждом запросе + `no-store` — манифест умирает мгновенно. `DELETE /share` ротирует `image_secret` снимков (кроме входящих в другие расшаренные): `CopyObject` по префиксу + удаление старого + новый `base` в `result.hips`, в `BackgroundTasks`, best-effort. Старые URL умирают за минуты; кэш уже скачанных тайлов — нет. Тайлы: `Cache-Control: public, max-age=86400`.
- **Что раскрывает ссылка.** `base` → префикс только своего снимка. Инварианты: (1) публичный бакет без анонимного листинга — политика только `s3:GetObject` на `img/*` (кастомный JSON, не `mc anonymous set download`); в чеклист деплоя `GET /?list-type=2 → 403`; (2) все тайлы, включая нерасшаренные, лежат в публичном бакете под секретом — «по обскурности»; (3) воркер не логирует `image_secret`, thumb перекодируется без exif/xmp/icc (тест: нет APP1).
- **Индексация.** v1: роутер на `/s/` ставит `<meta name="robots" content="noindex,nofollow">` + `X-Robots-Tag` на `/api/v1/public`. Per-location в nginx — после выбора хостинга; в `location /s/` повторить все `add_header … always` (location отменяет серверные) + `Referrer-Policy: no-referrer`. `/s/` не в `robots.txt` Disallow — краулер не увидит noindex.
- **Referer и клиент.** `<meta name="referrer" content="no-referrer">`, `rel="noopener noreferrer"`, без сторонних скриптов на `/s/*`. `/public` — отдельный axios-экземпляр без Authorization и 401-интерсептора (иначе протухший токен → logout → `/login`).
- **Логи.** v1: uvicorn `--no-access-log`. Токен в логах ingress/Cloudflare, секрет в access-логах бакета (не включать) — принято, ретенция 7–14 дней.
- **Гости.** Могут шарить; ключ владения — refresh-токен в localStorage (Zitadel idle 30 дн.), cleanup-cron ещё нет → `expires_at`. В cleanup явно `DELETE FROM collections WHERE user_id IN (…)` — CASCADE сюда не дотянется.
- **Abuse.** Runbook: `UPDATE collections SET share_token = NULL WHERE user_id = …` + блок в Zitadel; в футере `/s/` — «Report» mailto.
- **Не защищено, и это ок.** Пересылка ссылки; кэш зрителей после revoke; per-collection OG (статические `<title>`/`og:*` для SPA — в E1).

## 6. UX

База — APO-85 (прототип APO-86): `MySkyPanel.vue`, `userHipsComposite.js`, `FootprintManager.js`; коллекция — другой список images.

**Владелец.** Панель грузит `/me/sky` + `/me/collections`; в шапке дропдаун «Collection ▾» (All / список / + New), активная — в localStorage. «⋯» у снимка → «Add to collection ▸» / «Remove from …»; в шапке коллекции — Rename инлайн, [Share], «Add images» (чеклист, один `PATCH`), Delete с confirm. `ShareDialog.vue`: тумблер «Anyone with the link can view», ссылка + Copy (`navigator.share` на touch), подпись «Turn off to revoke; turning on again creates a new link. Hidden (eye) photos are included», гостю — строка про 30 дней и очистку storage. Включение тумблера создаёт и сразу копирует ссылку.

**Зритель.** `/s/:token` → `Scene.vue` в режиме `shared`: без Authorization и `POST /auth/guest`. Старт — fit-all, `?img=` → к снимку, `?tour=1` → автотур. Панель `readOnly`: без дропдауна/⋯/Share; перелёты, контуры, Compare with DSS, Opacity, Tour работают; eye — в памяти. CTA: аноним «Solve your own photos →», залогинен «Open My Sky»; owner-детекта нет. Состояния: loading; 404 → «This collection isn't available»; остальное → «Couldn't load, try again» + retry.

**Mobile** — E2 после v1. В v1 на `/s/` не писать `hiddenIds`/outlines/labels в глобальные ключи localStorage; `App.vue`, `SideMenu.vue` учитывают публичный роут.

## 7. Edge cases

- Снимок удалён → CASCADE из коллекций, тайлы уже удалены. В нескольких коллекциях: удаление из одной не трогает другие; секрет не ротируется, пока он в другой расшаренной.
- Re-solve (APO-27) = новый снимок для коллекций, старый уходит с задачей.
- Убрали все снимки → ссылка живёт, empty-state. Пустую расшарить можно.
- `tiling` → спиннер и контур, гость не поллит. `failed` — не в коллекцию и не в ответ.
- `?img=` не из коллекции → fit-all. Eye-скрытые снимки в шару попадают. Владелец на своей ссылке — обычный viewer.
- Отозвано во время просмотра → сессия доживает (тайлы могут начать 404-ить), следующая загрузка → «isn't available».
- Удаление аккаунта (G): `share_token = NULL` → purge `img/{secret}/` и `users/{sub}/` → `DELETE collections, submissions` (CASCADE), `astrometry_api_keys` → `zitadel.delete_user`. Cleanup гостей — тот же код с другим селектором.

## 8. Разбивка на тикеты

| # | Тикет | Зависит | Внешние | Оценка |
|---|---|---|---|---|
| A | БД + owner API коллекций | — | — | M |
| B | Правка спецификаций: per-image secret, `thumb.jpg` 256px без EXIF, `Cache-Control` (APO-83/84); политика бакета (APO-81) | — | — | XS |
| B′ | Синхронный purge в `delete_submission` + `rotate_image_secret` | B | APO-83 | S |
| C | Share + public endpoint, заголовки, Cloudflare-правило; сценарии «share → anon → revoke → 404», «share → тайл 200 → DELETE → тайл 404» | A, B′ | APO-83/84 | M |
| D | Панель владельца: дропдаун, ⋯-меню, Add images, `ShareDialog.vue` | A, C | APO-85 | L |
| E1 | Viewer desktop: readOnly, public axios, изоляция localStorage, meta robots, статический OG | C | APO-85 | M |
| E2 | Mobile: bottom sheet, аккордеон | E1 | — | M |
| F | Ротация секретов при `DELETE /share` | B′, C | — | S |
| G | Удаление аккаунта / cleanup гостей | B′ | — | S |

Порядок: A ∥ B → [APO-81 → 83 → 84 → 85] → B′ → C → D ∥ E1 ∥ F ∥ G → E2. v1 = всё, кроме E2.

## 9. Открытые вопросы

1. ~~Per-image secret~~ — принят, вносится в APO-83/84 (B).
2. Хостинг фронта: k8s-nginx или бакет? v1 не блокирует (meta robots на роутере, URL из `location.origin`); влияет на per-location заголовки и OIDC redirect_uri.
3. ~~Гости шарят~~ — да, с `expires_at`.
4. ~~Rate limit~~ — Cloudflare-правило ставит исполнитель C.
5. ~~OG~~ — статика в v1, UA-роутинг потом.

## Что учли из ревью

- Убрали `sky_images` и `shared_at`; секрет живёт в `tasks.result.hips.base`, B стал правкой APO-83/84, зависимость от APO-81/83/84/85 прописана явно.
- Удаление снимка стало честным: синхронный purge обоих префиксов (закрывает и старую течь output-файлов) + сценарный тест; на той же машинерии — ротация секретов при Stop sharing (F) и удаление аккаунта (G).
- API упрощён: `PATCH` с массивом `items`, идемпотентный `POST /share` + `DELETE /share`, без `url`/`PUBLIC_APP_ORIGIN` и 422 на пустую; `failed` отфильтрованы; `filename` не утекает через `title` и EXIF thumb.
- Инфраструктура исправлена на реальную (Cloudflare → ingress-nginx), лимит — правило Cloudflare; `expires_at` закрывает гостевые ссылки-призраки.
- Отклонили: `immutable` на год (URL отзываемы — сутки); маскирование логов и `X-Robots-Tag` per-location в v1 (`--no-access-log` и meta robots дают то же дешевле); owner-детект и «Preview as viewer» (риск 401 → logout, у Google Photos их нет).
