#!/usr/bin/env python3
"""Seed Zitadel: project + test user + playground app.

Idempotent — safe to run multiple times.

Usage:
    make seed-auth          # reads ZITADEL_ADMIN_PAT from .env
    python3 seed.py         # same, but manually
"""

import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "requests"])
    import requests


# ─── Config ──────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent

SEED_CONFIG = {
    "project_name": "Skymap",
    "test_user": {
        "username": "testuser",
        "first_name": "Test",
        "last_name": "User",
        "email": "testuser@skymap.local",
        "password": "TestPassword1!",
    },
    "playground_app": {
        "name": "playground",
        "redirect_uris": ["http://localhost:5500/"],
    },
}


# ─── .env loader ─────────────────────────────────────────────────────────────

def load_dotenv():
    env_file = PROJECT_ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


# ─── Seeder ───────────────────────────────────────────────────────────────────

class ZitadelSeeder:
    def __init__(self, base_url: str, pat: str):
        self.base_url = base_url.rstrip("/")
        self.s = requests.Session()
        self.s.headers.update({
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
        })

    def _post(self, path: str, body: dict) -> dict:
        r = self.s.post(f"{self.base_url}{path}", json=body, timeout=10)
        if not r.ok:
            raise RuntimeError(f"POST {path} → {r.status_code}: {r.text[:300]}")
        return r.json()

    def wait_ready(self, timeout: int = 30):
        url = f"{self.base_url}/healthz"
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                r = requests.get(url, timeout=3)
                if r.ok:
                    return
            except requests.ConnectionError:
                pass
            time.sleep(2)
        raise RuntimeError(f"Zitadel not reachable at {self.base_url} after {timeout}s")

    # ── Project ───────────────────────────────────────────────────────────────

    def ensure_project(self, name: str) -> str:
        data = self._post("/management/v1/projects/_search", {
            "queries": [{"nameQuery": {"name": name, "method": "TEXT_QUERY_METHOD_EQUALS"}}]
        })
        if data.get("result"):
            pid = data["result"][0]["id"]
            print(f"  project '{name}': exists  (id={pid})")
            return pid

        data = self._post("/management/v1/projects", {"name": name})
        pid = data["id"]
        print(f"  project '{name}': created (id={pid})")
        return pid

    # ── Human user ────────────────────────────────────────────────────────────

    def ensure_human_user(self, cfg: dict) -> str:
        username = cfg["username"]
        data = self._post("/management/v1/users/_search", {
            "queries": [{"userNameQuery": {
                "userName": username,
                "method": "TEXT_QUERY_METHOD_EQUALS",
            }}]
        })
        if data.get("result"):
            uid = data["result"][0]["id"]
            print(f"  user '{username}': exists  (id={uid})")
            return uid

        data = self._post("/management/v1/users/human/_import", {
            "userName": username,
            "profile": {
                "firstName": cfg["first_name"],
                "lastName": cfg["last_name"],
                "displayName": f"{cfg['first_name']} {cfg['last_name']}",
            },
            "email": {
                "email": cfg["email"],
                "isEmailVerified": True,
            },
            "password": cfg["password"],
            "passwordChangeRequired": False,
        })
        uid = data["userId"]
        print(f"  user '{username}': created (id={uid})")
        return uid

    # ── OIDC app ──────────────────────────────────────────────────────────────

    def ensure_oidc_app(self, project_id: str, cfg: dict) -> str:
        name = cfg["name"]
        data = self._post(f"/management/v1/projects/{project_id}/apps/_search", {
            "queries": [{"nameQuery": {"name": name, "method": "TEXT_QUERY_METHOD_EQUALS"}}]
        })
        if data.get("result"):
            client_id = data["result"][0].get("oidcConfig", {}).get("clientId", "(unknown)")
            print(f"  app '{name}': exists  (clientId={client_id})")
            return client_id

        data = self._post(f"/management/v1/projects/{project_id}/apps/oidc", {
            "name": name,
            "responseTypes": ["OIDC_RESPONSE_TYPE_CODE"],
            "grantTypes": ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
            "appType": "OIDC_APP_TYPE_USER_AGENT",
            "authMethodType": "OIDC_AUTH_METHOD_TYPE_NONE",
            "redirectUris": cfg["redirect_uris"],
            "postLogoutRedirectUris": cfg["redirect_uris"],
            "devMode": True,
            "accessTokenType": "OIDC_TOKEN_TYPE_JWT",
        })
        client_id = data["clientId"]
        print(f"  app '{name}': created (clientId={client_id})")
        return client_id


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    load_dotenv()

    zitadel_url = os.environ.get("ZITADEL_URL", "http://host.docker.internal:8080")
    pat = os.environ.get("ZITADEL_ADMIN_PAT", "")

    if not pat:
        print("ERROR: ZITADEL_ADMIN_PAT не задан.\n")
        print("Как создать PAT (один раз):")
        print("  1. make up-auth")
        print("  2. Открыть http://host.docker.internal:8080")
        print("  3. Войти: zitadel-admin@zitadel.localhost / Password1!")
        print("  4. Аватар (правый верхний угол) → Security → Personal Access Tokens → +")
        print("  5. Скопировать токен → добавить в .env:")
        print("       ZITADEL_ADMIN_PAT=<токен>")
        print("  6. make seed-auth")
        sys.exit(1)

    seeder = ZitadelSeeder(zitadel_url, pat)

    print(f"Ожидаю Zitadel ({zitadel_url})...")
    seeder.wait_ready()
    print("Zitadel готов.\n")

    try:
        print("[Project]")
        project_id = seeder.ensure_project(SEED_CONFIG["project_name"])

        print("\n[Test user]")
        seeder.ensure_human_user(SEED_CONFIG["test_user"])

        print("\n[Playground app]")
        client_id = seeder.ensure_oidc_app(project_id, SEED_CONFIG["playground_app"])

    except RuntimeError as e:
        print(f"\nERROR: {e}")
        sys.exit(1)

    u = SEED_CONFIG["test_user"]
    print(f"""
{'=' * 52}
Seed завершён!

  Тестовый пользователь:
    login:    {u['email']}
    password: {u['password']}

  Playground app:
    clientId: {client_id}

  ZITADEL_AUDIENCE (project id): {project_id}

Следующий шаг:
  Открыть http://localhost:5500/
  → Configuration → вставить clientId → Save
  → Login via Zitadel
{'=' * 52}
""")

    # Auto-update .env with ZITADEL_AUDIENCE
    _update_env("ZITADEL_AUDIENCE", project_id)


def _update_env(key: str, value: str):
    """Add or update a key in .env. Idempotent."""
    env_file = PROJECT_ROOT / ".env"
    lines = env_file.read_text().splitlines() if env_file.exists() else []

    found = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith(f"{key}=") or stripped.startswith(f"{key} ="):
            old_val = stripped.split("=", 1)[1].strip().strip('"').strip("'")
            if old_val == value:
                return  # already correct
            lines[i] = f"{key}={value}"
            found = True
            print(f"  .env: обновлён {key}={value}")
            break

    if not found:
        lines.append(f"{key}={value}")
        print(f"  .env: добавлен {key}={value}")

    env_file.write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
