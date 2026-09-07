"""Account router — the user erasing their own account (APO-93, design §7).

One endpoint, no confirmation flow: the frontend owns the "type your email to
confirm" dialog, the API only executes.  The work itself, and the order it has to
happen in, live in `services.account_cleanup`.
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_current_user, get_db, get_hips_storage, get_storage, get_zitadel
from ..services.account_cleanup import delete_account
from ..services.hips_storage import HipsStorage
from ..services.image_tiles import redact_secrets
from ..services.storage import StorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/me", tags=["Account"])


@router.delete(
    "/account",
    responses={
        204: {"description": "Everything is gone, identity included"},
        200: {"description": "The data is erased but the identity survived — see `identity`"},
        503: {"description": "Storage is unavailable; nothing was deleted"},
    },
)
async def delete_my_account(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageService = Depends(get_storage),
    hips_storage: HipsStorage = Depends(get_hips_storage),
    zitadel: Any = Depends(get_zitadel),
):
    """Erase everything the caller owns, then the caller's identity.

    503 on a storage failure, exactly like `DELETE /submissions/{id}`: the rows
    are still there, so the client can simply try again.  The response body never
    quotes the failure — a storage error names the object key, i.e. an image's
    capability secret.

    204 means *everything* is gone.  A partial deletion must not look like a complete
    one: `clients.zitadel.ZitadelClient` speaks no management API yet, so today the
    identity survives every erasure — the user's email, name and credentials stay at
    the IdP and the account can still sign in.  That case answers 200 with
    `{"data_erased": true, "identity": "skipped" | "failed"}` so the frontend can tell
    the user their login still has to be removed by hand, instead of the API claiming
    a deletion it did not perform.
    """
    try:
        report = await delete_account(
            user_id, db=db, storage=storage, hips_storage=hips_storage, zitadel=zitadel,
        )
    except Exception as e:
        logger.error("Account deletion for %s failed: %s", user_id, redact_secrets(str(e)))
        # `from None`: keep the tile secret quoted by a storage error out of the
        # chained traceback (it is already redacted in the line above).
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage is unavailable, the account was not deleted",
        ) from None

    if report.identity != "deleted":
        # `error`, not `warning`: this is the only record that an erasure request was
        # carried out only in part, and it belongs in whatever watches the error log.
        logger.error("Account %s: data erased, identity %s — the login still exists and "
                     "has to be removed at the identity provider", user_id, report.identity)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"data_erased": True, "identity": report.identity},
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
