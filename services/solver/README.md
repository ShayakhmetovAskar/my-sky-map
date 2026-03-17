# Solver Service

Plate solving API — принимает изображения, решает координаты через astrometry, возвращает результат.

## Структура

```
app/
├── main.py              FastAPI app, healthcheck
├── config.py             Settings из env vars
├── dependencies.py       get_db, get_current_user (JWT stub)
├── models/
│   ├── schemas.py        Pydantic модели (из OpenAPI spec)
│   └── db.py             SQLAlchemy ORM (Submission, Task)
├── routers/
│   ├── submissions.py    CRUD + confirm upload
│   └── tasks.py          CRUD + cancel
└── services/
    ├── storage.py        MinIO interface (stub)
    └── queue.py          RabbitMQ interface (stub)

alembic/                  DB migrations
entrypoint.sh             Migrations → uvicorn
```

## Быстрый старт

```bash
# Из корня проекта
make up          # поднять solver + postgres + minio + rabbitmq
make logs        # логи solver-api
make down        # остановить всё
```

Или вручную:

```bash
docker compose -f docker-compose.dev.yml up solver-api postgres minio rabbitmq -d --build
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /submissions | Создать submission, получить presigned URL |
| GET | /submissions | Список submissions |
| GET | /submissions/{id} | Детали submission |
| DELETE | /submissions/{id} | Удалить submission |
| POST | /submissions/{id}/confirm | Подтвердить загрузку файла |
| POST | /tasks | Создать задачу обработки |
| GET | /tasks | Список задач |
| GET | /tasks/{id} | Статус и результат задачи |
| POST | /tasks/{id}/cancel | Отменить задачу |
| GET | /healthcheck | Health check |

Swagger UI: http://localhost:8001/docs

## Порты (dev)

| Сервис | Порт |
|--------|------|
| Solver API | localhost:8001 |
| PostgreSQL | localhost:5433 |
| MinIO API | localhost:9000 |
| MinIO Console | localhost:9001 |
| RabbitMQ | localhost:5672 |
| RabbitMQ UI | localhost:15672 |

## Подключение к БД из DataGrip

1. **File → New → Data Source → PostgreSQL**
2. Заполнить:
   - **Host:** `localhost`
   - **Port:** `5433`
   - **Database:** `skymap_db`
   - **User:** `skymap_user`
   - **Password:** `skymap_password`
3. **Test Connection** → должен быть зелёный
4. Таблицы `submissions` и `tasks` будут в схеме `public`

## MinIO Console

Открыть http://localhost:9001

- **User:** `minioadmin`
- **Password:** `minioadmin`

## RabbitMQ Management

Открыть http://localhost:15672

- **User:** `guest`
- **Password:** `guest`

### Как посмотреть сообщения в очереди

1. Зайти в **Queues and Streams** → `solver_tasks`
2. Внизу раскрыть **Get messages**
3. Нажать **Get Message(s)** — покажет JSON:
   ```json
   {
     "task_id": "734209b2-...",
     "submission_id": "16fe8f69-...",
     "object_key": "users/.../original.jpg",
     "options": null
   }
   ```
4. **Ack Mode = Nack message requeue true** — сообщение останется в очереди после просмотра

### Полезные вкладки

- **Queues** — очереди, количество сообщений, скорость publish/consume
- **Connections** — кто подключён (solver-api)
- **Exchanges** — default exchange используется для публикации
