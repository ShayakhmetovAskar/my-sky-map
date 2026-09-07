"""Public router — reading a shared collection by its capability token (APO-88).

The only unauthenticated router in the service. See docs/my-sky-collections-sharing.md §4–5.

Two invariants hold everything together:

* **One 404 for everything.** Malformed, unknown, revoked and expired tokens are
  indistinguishable from outside, so a probe learns nothing from the status code and
  there is no "this token existed once" oracle.
* **Whitelist, not blacklist.** The response is built from `SkyImage`, the schema shared
  with `/me/sky`, and is additionally filtered by `response_model`. A field has to be
  added to `SkyImage` on purpose to become public; nothing leaks by being forgotten.
"""

import re
from datetime import datetime, timezone
from typing import Callable

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.routing import APIRoute
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_db
from ..models.db import Collection, CollectionItem, Submission, Task
from ..schemas.sky import LISTED_TASK_STATUSES, PublicSkyResponse, SkyImage

# `secrets.token_urlsafe(16)` — exactly 22 characters from the url-safe base64 alphabet.
# Matched with `fullmatch`, not `match`: Python's `$` also matches just before a trailing
# newline, so `.../sky/AAAA...%0A` would pass an anchored `match` and reach the database.
SHARE_TOKEN_RE = re.compile(r"[A-Za-z0-9_-]{22}")

# `no-store`, not `no-cache`: revocation is checked per request, so no shared cache or
# browser may keep the manifest around after the link is turned off. `X-Robots-Tag` keeps
# a token that reached a crawler (referer, pasted link) out of the index.
PRIVACY_HEADERS = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
}


class PrivateRoute(APIRoute):
    """Stamp `PRIVACY_HEADERS` on every response of this router, errors included.

    Setting them inside the handler would cover the 200 and quietly miss the 404 — which
    is the response a token actually gets once it is revoked, and the one that must not be
    cached. Doing it at the route level makes the guarantee structural: it also covers
    endpoints added to this router later.
    """

    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def privacy_route_handler(request: Request) -> Response:
            try:
                response = await original_route_handler(request)
            except HTTPException as exc:
                # An explicit header on the exception wins; FastAPI's handler passes
                # `exc.headers` straight to the error response.
                exc.headers = {**PRIVACY_HEADERS, **(exc.headers or {})}
                raise
            response.headers.update(PRIVACY_HEADERS)
            return response

        return privacy_route_handler


router = APIRouter(prefix="/public", tags=["Public"], route_class=PrivateRoute)

def not_found() -> HTTPException:
    """Every failure mode answers with this, byte for byte.

    A fresh instance per raise: a shared one would accumulate `__traceback__` across
    requests, and the route class writes headers onto the exception it catches.
    """
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")


@router.get("/sky/{token}", response_model=PublicSkyResponse)
async def get_public_sky(token: str, db: AsyncSession = Depends(get_db)):
    """A shared collection as a sky layer manifest. No auth, no owner, no private fields."""
    # Shape check first: a scan of random paths is answered without a query, so the
    # database is never the thing absorbing a token-guessing flood.
    if not SHARE_TOKEN_RE.fullmatch(token):
        raise not_found()

    collection = (
        await db.execute(select(Collection).where(Collection.share_token == token))
    ).scalar_one_or_none()
    if collection is None:
        raise not_found()

    # Guest shares carry a deadline; owners' do not (`expires_at IS NULL`).
    if collection.expires_at is not None and collection.expires_at <= datetime.now(timezone.utc):
        raise not_found()

    query = (
        select(Task, Submission)
        .join(CollectionItem, CollectionItem.task_id == Task.id)
        .join(Submission, Submission.id == Task.submission_id)
        .where(
            CollectionItem.collection_id == collection.id,
            # Ownership is already enforced when items are added; re-stating it here means
            # a bug in that path cannot turn into someone else's image on a public URL.
            Task.user_id == collection.user_id,
            Task.status.in_(LISTED_TASK_STATUSES),
        )
        .order_by(CollectionItem.position)
    )
    rows = (await db.execute(query)).all()

    images = []
    for task, submission in rows:
        # Base `SkyImage`, never `MySkyImage`: the owner's view carries `filename`.
        image = SkyImage.from_task(task, date=submission.created_at.date())
        if image is not None:  # unsolved or tiling-failed images are not listed
            images.append(image)

    return PublicSkyResponse(title=collection.title, images=images)
