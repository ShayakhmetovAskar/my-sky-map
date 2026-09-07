# Public HiPS bucket — setup for the worker (APO-81 / APO-83)

Тайлы слоя My Sky лежат в **публичном** бакете `skymap-static-data` (том же, что DSS-подложка)
под неугадываемым префиксом на снимок и раздаются анонимно через CDN:

```
img/{image_secret}/Norder{k}/Npix{p}.png   512×512 RGBA, Cache-Control: public, max-age=86400
img/{image_secret}/thumb.jpg               256 px, RGB, без EXIF/XMP/ICC
```

`image_secret = secrets.token_urlsafe(16)` (128 бит) генерит воркер при тайлинге; он живёт
только в `tasks.result.hips.base` и никогда не логируется. Удаление снимка / отзыв шаринга —
удаление или переименование папки `img/{secret}/` (`HipsStorage.delete_prefix / copy_prefix`).

## Переменные окружения

| Переменная | dev (docker-compose) | staging / prod |
|---|---|---|
| `HIPS_ENDPOINT` | `host.docker.internal:9000` | `storage.yandexcloud.net` |
| `HIPS_BUCKET` | `skymap-static-data` | `skymap-static-data` |
| `HIPS_SECURE` | `false` | `true` |
| `HIPS_PUBLIC_BASE_URL` | `http://localhost:9000/skymap-static-data` | `https://storage.yandexcloud.net/skymap-static-data` |
| `HIPS_ACCESS_KEY` / `HIPS_SECRET_KEY` | `minioadmin` | статический ключ отдельного SA (см. ниже) |

Код: `app/config.py` (`hips_*`), клиент `app/services/hips_storage.py`, тайлер `worker/hips.py`.

## Dev (MinIO)

`docker-compose.dev.yml` содержит one-shot контейнер `minio-init` (образ `minio/mc`): создаёт
бакеты `skymap` и `skymap-static-data` и вешает на публичный бакет политику **только**
`s3:GetObject` на `img/*`. Воркер стартует после него (`service_completed_successfully`).
Ничего руками делать не нужно; проверка после `make up`:

```bash
curl -sI http://localhost:9000/skymap-static-data/img/does-not-exist/thumb.jpg | head -1   # 404, не 403
curl -s  "http://localhost:9000/skymap-static-data/?list-type=2" | head -c 200           # AccessDenied
```

## Staging / prod (Yandex Cloud)

Ключ **не** тот, что у `frontend-release` в GitHub secrets: воркеру — свой сервис-аккаунт,
чтобы его можно было отозвать отдельно.

```bash
FOLDER=$(yc config get folder-id)

# 1. SA только для воркера, права — загрузка в один бакет
yc iam service-account create --name skymap-hips-worker
SA_ID=$(yc iam service-account get skymap-hips-worker --format json | jq -r .id)
yc storage bucket update skymap-static-data \
  --grants grantee-id=$SA_ID,grant-type=grant-type-account,permission=permission-write   # или:
yc resource-manager folder add-access-binding $FOLDER \
  --role storage.uploader --subject serviceAccount:$SA_ID     # если удобнее ролью на каталог

# 2. Статический ключ
yc iam access-key create --service-account-name skymap-hips-worker
#   -> key_id (HIPS_ACCESS_KEY) и secret (HIPS_SECRET_KEY), secret показывается один раз

# 3. В кластер (Secret не хранится в git, деплой его не трогает)
kubectl -n skymap create secret generic skymap-hips-secrets \
  --from-literal=HIPS_ACCESS_KEY=<key_id> \
  --from-literal=HIPS_SECRET_KEY=<secret>
kubectl -n skymap rollout restart deployment/solver-worker deployment/solver-api
```

`k8s/base/configmap.yaml` уже содержит `HIPS_ENDPOINT/BUCKET/SECURE/PUBLIC_BASE_URL`;
деплойменты ссылаются на `skymap-hips-secrets` как `optional`, поэтому под стартует и без ключа —
тайлинг тогда завершается `completed` + `result.hips_error`, сам солв не страдает.

### Политика бакета

Анонимно должен читаться **только** `img/*` (и уже существующий `dss/*`), листинг запрещён.
Не `mc anonymous set download` / «публичный доступ на чтение» в консоли — кастомный JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::skymap-static-data/dss/*",
        "arn:aws:s3:::skymap-static-data/img/*"
      ]
    }
  ]
}
```

Консоль YC → бакет → «Политика доступа», либо `aws s3api put-bucket-policy --bucket skymap-static-data --policy file://policy.json --endpoint-url https://storage.yandexcloud.net`.

### Чеклист после настройки

- [ ] `GET https://storage.yandexcloud.net/skymap-static-data/?list-type=2` → **403** (листинг закрыт)
- [ ] `GET .../img/anything/thumb.jpg` → 404 (не 403 — префикс читаем)
- [ ] CORS: DSS-тайлы уже грузятся в WebGL cross-origin, правило действует на весь бакет; проверить
      `curl -sI -H 'Origin: https://skymap-app.afsh.space' <любой тайл>` → `Access-Control-Allow-Origin`
- [ ] Access-логи бакета **выключены** (в путях секреты)
- [ ] Пробная запись воркером: после солва в `task.result.hips.base` появляется URL, тайл
      `{base}/Norder0/Npix{p}.png` открывается анонимно с `Cache-Control: public, max-age=86400`
