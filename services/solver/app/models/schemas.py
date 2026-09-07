"""Pydantic schemas generated from solver-api-spec.yaml (v1.1.0), manually refined."""

from __future__ import annotations

from enum import Enum
from typing import Annotated, Any, Optional
from uuid import UUID

from pydantic import AfterValidator, AwareDatetime, BaseModel, Field, StringConstraints, confloat, conint, field_validator


# --- Enums ---

class ContentType(str, Enum):
    jpeg = "image/jpeg"
    png = "image/png"
    fits = "application/fits"


class SubmissionStatus(str, Enum):
    pending = "pending"
    uploaded = "uploaded"
    processing = "processing"
    tiling = "tiling"  # solved, the worker is cutting the image into sky tiles
    completed = "completed"
    failed = "failed"


class TaskStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    tiling = "tiling"  # solved, the worker is cutting the image into sky tiles
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


# --- Error ---

class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code", examples=["submission_not_found"])
    message: str = Field(..., description="Human-readable error message", examples=["Submission with the given ID was not found"])


class ErrorResponse(BaseModel):
    error: ErrorDetail


# --- Submission schemas ---

class CreateSubmissionRequest(BaseModel):
    filename: str = Field(..., examples=["andromeda.fits"])
    content_type: ContentType
    file_size_bytes: conint(ge=1, le=52428800) = Field(..., description="File size in bytes (max 50 MB)")


class RequiredHeaders(BaseModel):
    x_amz_meta_userid: Optional[str] = Field(None, alias="x-amz-meta-userid", description="User ID for ownership validation")


class SubmissionCreatedResponse(BaseModel):
    submission_id: UUID
    object_key: str
    upload_url: str = Field(..., description="Presigned S3 URL for direct file upload (PUT)")
    required_headers: Optional[RequiredHeaders] = Field(None, description="Headers the client must include in the S3 PUT request")


class SubmissionSummary(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    status: SubmissionStatus
    filename: str
    created_at: AwareDatetime
    updated_at: AwareDatetime
    thumbnail_url: Optional[str] = None


class SubmissionDetailed(SubmissionSummary):
    object_key: str
    tasks: list[TaskSummary] = []


# --- Task schemas ---

class SolverOptions(BaseModel):
    focal_length: Optional[confloat(ge=1.0)] = Field(None, description="Focal length in mm")
    pixel_size: Optional[confloat(ge=0.1)] = Field(None, description="Pixel size in micrometers")


class CreateTaskRequest(BaseModel):
    submission_id: UUID = Field(..., description="Submission ID with uploaded file")
    options: Optional[SolverOptions] = Field(None, description="Solver hints (all optional)")


class TaskError(BaseModel):
    code: str = Field(..., examples=["solver_timeout"])
    message: str = Field(..., examples=["Solver did not find a solution within the time limit"])


class TaskSummary(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    submission_id: UUID
    status: TaskStatus
    created_at: AwareDatetime
    updated_at: AwareDatetime
    completed_at: Optional[AwareDatetime] = None


class TaskDetailed(TaskSummary):
    result: Optional[dict[str, Any]] = Field(
        None,
        description="Solver result. Keys: center_ra, center_dec, pixel_scale, orientation, "
                    "field_of_view, original_image_key, annotated_image_key, wcs_key, mesh_json_key, "
                    "astrometry_job_url, hips (kmax, tiles, moc, base, thumb, seconds), corners, "
                    "hips_error. URL keys are generated on read.",
    )
    error: Optional[TaskError] = Field(None, description="Present when status is failed")


# --- Collection schemas (My Sky) ---

MAX_COLLECTIONS_PER_USER = 50
MAX_COLLECTION_ITEMS = 200

CollectionTitle = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


def _unique_task_ids(items: list[UUID]) -> list[UUID]:
    if len(set(items)) != len(items):
        raise ValueError("items must not contain duplicate task ids")
    return items


CollectionItems = Annotated[
    list[UUID],
    Field(max_length=MAX_COLLECTION_ITEMS, description="Full ordered list of task ids; position = array index"),
    AfterValidator(_unique_task_ids),
]


class CreateCollectionRequest(BaseModel):
    title: CollectionTitle


class UpdateCollectionRequest(BaseModel):
    title: Optional[CollectionTitle] = None
    items: Optional[CollectionItems] = None


class CollectionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    title: str
    items: list[UUID] = Field(default_factory=list, description="Task ids ordered by position")
    share_token: Optional[str] = None
    expires_at: Optional[AwareDatetime] = None
    created_at: AwareDatetime
    updated_at: AwareDatetime

    @field_validator("items", mode="before")
    @classmethod
    def _items_from_orm(cls, value):
        # ORM relationship yields CollectionItem rows (already ordered by position)
        return [getattr(item, "task_id", item) for item in value]


class ShareResponse(BaseModel):
    """`POST /me/collections/{id}/share`. Only the token: the frontend builds the URL
    from `location.origin`, so the API never has to know the public hostname."""

    token: str = Field(..., description="Capability token; the share URL is {origin}/s/{token}")


# --- Pagination ---

class PaginatedSubmissions(BaseModel):
    items: list[SubmissionSummary]
    total: int


class PaginatedTasks(BaseModel):
    items: list[TaskSummary]
    total: int


# Resolve forward reference
SubmissionDetailed.model_rebuild()
