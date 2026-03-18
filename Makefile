COMPOSE = docker compose -f docker-compose.dev.yml
SOLVER_SERVICES = solver-api solver-worker postgres minio

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
AUTH_COMPOSE = docker compose -f services/auth/docker-compose.zitadel.yml

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
	services/.venv/bin/pip install -q requests
	services/.venv/bin/python services/auth/scripts/seed.py

# --- Full stack ---
up-all:
	$(AUTH_COMPOSE) up -d
	$(COMPOSE) up -d --build

# --- Cleanup ---
clean:
	$(COMPOSE) down -v --remove-orphans
	$(AUTH_COMPOSE) down -v --remove-orphans

.PHONY: up down logs logs-worker restart ps db-shell migrate migration up-auth reset-auth down-auth logs-auth seed-auth up-all clean
