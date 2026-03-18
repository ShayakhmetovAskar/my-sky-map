# Auth Service (Zitadel)

Self-hosted Zitadel — identity provider для Skymap.

## Предварительная настройка (один раз)

Zitadel должен быть доступен по одному URL и из браузера, и из Docker-контейнеров.
Мы используем `host.docker.internal` — внутри Docker он резолвится в хост-машину автоматически,
но на самой хост-машине его нужно добавить вручную:

```bash
# Проверить — может уже есть:
grep host.docker.internal /etc/hosts

# Если нет — добавить (один раз, нужен sudo):
echo "127.0.0.1 host.docker.internal" | sudo tee -a /etc/hosts
```

> **Зачем:** JWT токен содержит `iss: http://host.docker.internal:8080`. Solver API внутри Docker
> проверяет этот issuer и фетчит публичные ключи по тому же URL. Если URL разный для браузера
> и для Docker — авторизация не работает (issuer mismatch → 401).

---

## Быстрый старт (новая машина / первый запуск)

```bash
make up-auth        # 1. поднять Zitadel + Postgres
# → создать PAT (см. ниже, один раз)
make seed-auth      # 2. залить проект + тестового пользователя + playground app
make up             # 3. поднять solver stack
make up-playground  # 4. поднять playground UI
```

## Credentials после seed-auth

| Что | Значение |
|-----|----------|
| **Admin login** | `zitadel-admin@skymap.host.docker.internal` |
| **Admin password** | `Password1!` |
| **Test user login** | `testuser@skymap.local` |
| **Test user password** | `TestPassword1!` |
| **Playground Client ID** | выводится `make seed-auth` |
| **ZITADEL_AUDIENCE** | автоматически пишется в `.env` |

| URL | Что |
|-----|-----|
| http://host.docker.internal:8080/ui/console | Zitadel admin console |
| http://localhost:5500 | API Playground |
| http://localhost:8001 | Solver API (direct) |

---

## Создание PAT (один раз)

PAT нужен для `make seed-auth`. Создаётся один раз, хранится в `.env`.

1. Открыть **http://host.docker.internal:8080/ui/console**
2. Войти: `zitadel-admin@skymap.host.docker.internal` / `Password1!`
3. Нажать на **аватар** (правый верхний угол) → **Security**
4. **Personal Access Tokens** → **+** → expiration оставить пустым
5. Скопировать токен
6. Добавить в `.env` в корне проекта:
   ```
   ZITADEL_ADMIN_PAT=<скопированный токен>
   ```
7. Запустить:
   ```bash
   make seed-auth
   ```

Скрипт идемпотентен — повторный запуск ничего не ломает.

---

## Команды

```bash
# Из корня проекта
make up-auth        # поднять Zitadel + Postgres
make logs-auth      # логи
make down-auth      # остановить
```

Zitadel UI: http://host.docker.internal:8080

## Первичная настройка

### 1. Войти в консоль

- URL: http://host.docker.internal:8080
- Login: `zitadel-admin@skymap.host.docker.internal`
- Password: `Password1!`

### 2. Создать проект

1. **Projects** → **Create New Project**
2. Name: `Skymap`
3. Сохранить — запомнить **Resource ID** проекта (понадобится для `ZITADEL_AUDIENCE`)

### 3. Создать API Application (для solver backend)

1. В проекте Skymap → **Applications** → **New**
2. Name: `solver-api`
3. Type: **API**
4. Auth Method: **Basic** (или JWT)
5. Сохранить

### 4. Создать тестового пользователя

1. **Users** → **New**
2. Username: `testuser`
3. Name: `Test User`
4. Email: `test@skymap.local`
5. Password: задать вручную

### 5. Настроить переменные окружения

В `docker-compose.dev.yml` для solver-api:
```yaml
ZITADEL_ISSUER_URL: http://zitadel:8080
ZITADEL_AUDIENCE: <Project Resource ID из шага 2>
```

## Получить JWT для тестирования

### Через curl (Resource Owner Password Grant):

```bash
curl -s -X POST http://host.docker.internal:8080/oauth/v2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=<client-id>" \
  -d "username=testuser" \
  -d "password=<password>" \
  -d "scope=openid profile email"
```

### Проверить JWT:

```bash
curl -s http://localhost:8001/submissions \
  -H "Authorization: Bearer <access_token>"
```

## Создать User Agent Application (для API Playground)

Playground использует OIDC Authorization Code + PKCE flow. Нужно создать отдельное приложение в Zitadel.

### 1. Создать приложение

1. В проекте Skymap → **Applications** → **New**
2. Name: `playground`
3. Type: **User Agent**
4. Redirect URI: `http://localhost:8889/playground/`
5. Post-logout URI: `http://localhost:8889/playground/`
6. Сохранить → скопировать **Client ID**

> Для staging — добавить дополнительный Redirect URI с URL staging-окружения.

### 2. Вставить Client ID в playground

1. Открыть http://localhost:8889/playground/
2. Раскрыть секцию **Configuration**
3. Вставить Client ID → нажать **Save config**
4. Нажать **Login via Zitadel**

## Эндпоинты Zitadel

| Endpoint | URL |
|----------|-----|
| Console | http://host.docker.internal:8080 |
| OIDC Discovery | http://host.docker.internal:8080/.well-known/openid-configuration |
| JWKS | http://host.docker.internal:8080/oauth/v2/keys |
| Token | http://host.docker.internal:8080/oauth/v2/token |
| Authorization | http://host.docker.internal:8080/oauth/v2/authorize |

## Архитектура

```
Frontend (Vue) ──OIDC──→ Zitadel ──JWT──→ Solver API
                                            ↓
                                    JWKS validation
                                    (cached public key)
```

Solver API валидирует JWT локально через public key из JWKS endpoint. Не ходит в Zitadel на каждый запрос.
