COMPOSE = docker compose -f docker-compose.dev.yml
AUTH_COMPOSE = docker compose -f services/auth/docker-compose.zitadel.yml
PLAYGROUND_COMPOSE = docker compose -f services/playground/docker-compose.yml
SOLVER_SERVICES = solver-api solver-worker postgres minio
VENV = services/.venv/bin
SOLVER_DIR = services/solver
TEST_DB_URL = postgresql+asyncpg://skymap_user:skymap_password@localhost:5433/skymap_test

# --- Solver ---
up:
	$(COMPOSE) up $(SOLVER_SERVICES) -d --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs solver-api -f --tail 50

logs-worker:
	$(COMPOSE) logs solver-worker -f --tail 50

restart:
	$(COMPOSE) restart solver-api solver-worker

ps:
	$(COMPOSE) ps

# --- Database ---
db-shell:
	$(COMPOSE) exec postgres psql -U skymap_user -d skymap_db

migrate:
	$(COMPOSE) exec solver-api alembic upgrade head

migration:
	$(COMPOSE) exec solver-api alembic revision --autogenerate -m "$(msg)"

# --- Auth (Zitadel) ---
up-auth:
	$(AUTH_COMPOSE) up -d

reset-auth:
	$(AUTH_COMPOSE) down -v
	$(AUTH_COMPOSE) up -d

down-auth:
	$(AUTH_COMPOSE) down

logs-auth:
	$(AUTH_COMPOSE) logs zitadel -f --tail 50

seed-auth:
	$(VENV)/pip install -q requests
	$(VENV)/python services/auth/scripts/seed.py

# --- Playground ---
up-playground:
	$(PLAYGROUND_COMPOSE) up -d

down-playground:
	$(PLAYGROUND_COMPOSE) down

# --- Tests ---
test-unit: test-deps
	cd $(SOLVER_DIR) && DATABASE_URL=$(TEST_DB_URL) \
		MINIO_ENDPOINT=localhost:9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin MINIO_BUCKET=skymap \
		../../$(VENV)/python -m pytest tests/unit -v --tb=short

test-scenario: test-deps
	cd $(SOLVER_DIR) && DATABASE_URL=$(TEST_DB_URL) \
		MINIO_ENDPOINT=localhost:9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin MINIO_BUCKET=skymap \
		../../$(VENV)/python -m pytest tests/scenario -v --tb=short

test: test-unit test-scenario

test-deps:
	@$(COMPOSE) up -d postgres minio
	@$(COMPOSE) exec -T postgres psql -U skymap_user -d skymap_db -c "CREATE DATABASE skymap_test" 2>/dev/null || true

# --- Full stack ---
up-all:
	$(AUTH_COMPOSE) up -d
	$(COMPOSE) up -d --build

# --- Cleanup ---
clean:
	$(COMPOSE) down -v --remove-orphans
	$(AUTH_COMPOSE) down -v --remove-orphans

.PHONY: up down logs logs-worker restart ps db-shell migrate migration up-auth reset-auth down-auth logs-auth seed-auth up-playground down-playground test test-unit test-scenario test-deps up-all clean
