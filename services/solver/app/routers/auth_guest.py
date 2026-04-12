"""Guest authentication router — shadow account creation via Zitadel."""

import logging
import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request, status

from ..config import settings
from ..dependencies import get_zitadel_client
from ..guest_names import generate_guest_name
from ..models.schemas import GuestTokenResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

# Dev-only in-memory rate limiter: IP → list of timestamps.
#
# This is a defence-in-depth fallback for local development. In production
# the real protection lives at the load balancer / WAF (e.g. Yandex Cloud
# ALB rate limiting on POST /api/v1/auth/guest, or Smart Web Security with
# bot challenges). This in-memory limiter:
#   • does not survive process restart
#   • is not shared across replicas
#   • will grow unbounded under sustained traffic from many unique IPs
# Replace with a proper edge rule once the project is deployed.
_guest_requests: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 10  # max guest creations per IP per hour
RATE_WINDOW = 3600  # 1 hour


def _check_rate_limit(ip: str) -> None:
    """Enforce rate limit on guest account creation."""
    now = time.time()
    fresh = [t for t in _guest_requests.get(ip, []) if now - t < RATE_WINDOW]

    if len(fresh) >= RATE_LIMIT:
        _guest_requests[ip] = fresh
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many guest accounts created. Limit: {RATE_LIMIT}/hour.",
        )

    fresh.append(now)
    _guest_requests[ip] = fresh

    # Best-effort cleanup of stale IPs to bound memory growth.
    if len(_guest_requests) > 10000:
        for stale_ip in [k for k, v in _guest_requests.items()
                         if not any(now - t < RATE_WINDOW for t in v)]:
            del _guest_requests[stale_ip]


@router.post("/guest", response_model=GuestTokenResponse)
async def create_guest(request: Request):
    """Create a shadow Zitadel account and return a JWT for guest access."""
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    if not settings.guest_sa_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Guest authentication is not configured.",
        )

    zitadel = get_zitadel_client()
    public_name = generate_guest_name()

    # 1. Create shadow user in Zitadel.
    try:
        guest_user_id = await zitadel.create_shadow_user(
            sa_token=settings.guest_sa_key,
            org_id=settings.guest_org_id,
            public_name=public_name,
            display_name=f"Guest ({public_name})",
        )
    except Exception:
        logger.exception("Guest creation failed: could not create shadow user")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create guest account. Please try again later.",
        )

    # 2. Exchange service account token for a guest JWT. If this step
    #    fails the shadow user already exists in Zitadel, so we have to
    #    compensate by deleting it — otherwise the Zitadel organization
    #    slowly fills with orphaned users.
    try:
        token_data = await zitadel.exchange_token(
            sa_token=settings.guest_sa_key,
            guest_user_id=guest_user_id,
            client_id=settings.guest_client_id,
        )
    except Exception:
        logger.exception(
            "Guest creation failed: token exchange for %s (%s) failed, deleting shadow user",
            public_name,
            guest_user_id,
        )
        try:
            await zitadel.delete_user(settings.guest_sa_key, guest_user_id)
        except Exception:
            logger.exception("Compensating delete of guest %s also failed", guest_user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create guest account. Please try again later.",
        )

    logger.info("Guest account created: %s (%s) from IP %s", public_name, guest_user_id, client_ip)

    return GuestTokenResponse(
        token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
        user_id=guest_user_id,
        public_name=public_name,
        expires_in=token_data["expires_in"],
    )
