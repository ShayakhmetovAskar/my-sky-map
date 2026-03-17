# Auth Service (Zitadel)

Self-hosted Zitadel — identity provider для Skymap.

## Быстрый старт

```bash
# Из корня проекта
make up-auth        # поднять Zitadel + Postgres
make logs-auth      # логи
make down-auth      # остановить
```

Zitadel UI: http://localhost:8080

## Первичная настройка

### 1. Войти в консоль

- URL: http://localhost:8080
- Login: `zitadel-admin@zitadel.localhost`
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
curl -s -X POST http://localhost:8080/oauth/v2/token \
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

## Эндпоинты Zitadel

| Endpoint | URL |
|----------|-----|
| Console | http://localhost:8080 |
| OIDC Discovery | http://localhost:8080/.well-known/openid-configuration |
| JWKS | http://localhost:8080/oauth/v2/keys |
| Token | http://localhost:8080/oauth/v2/token |
| Authorization | http://localhost:8080/oauth/v2/authorize |

## Архитектура

```
Frontend (Vue) ──OIDC──→ Zitadel ──JWT──→ Solver API
                                            ↓
                                    JWKS validation
                                    (cached public key)
```

Solver API валидирует JWT локально через public key из JWKS endpoint. Не ходит в Zitadel на каждый запрос.
