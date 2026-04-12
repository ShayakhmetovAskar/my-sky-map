"""Pydantic schemas generated from solver-api-spec.yaml (v1.1.0), manually refined."""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, Field, confloat, conint


# --- Enums ---

class ContentType(str, Enum):
    jpeg = "image/jpeg"
    png = "image/png"
    fits = "application/fits"


class SubmissionStatus(str, Enum):
    pending = "pending"
    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class TaskStatus(str, Enum):
    pending = "pending"
    processing = "processing"
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
    astrometry_api_key: Optional[str] = Field(
        None,
        description="User's astrometry.net API key. If omitted, falls back to saved key in UserSettings.",
        min_length=1,
        max_length=128,
    )


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
                    "astrometry_job_url. URL keys are generated on read.",
    )
    error: Optional[TaskError] = Field(None, description="Present when status is failed")


# --- Pagination ---

class PaginatedSubmissions(BaseModel):
    items: list[SubmissionSummary]
    total: int


class PaginatedTasks(BaseModel):
    items: list[TaskSummary]
    total: int


# --- User Settings schemas ---

class UserSettingsResponse(BaseModel):
    astrometry_api_key: Optional[str] = Field(None, description="Masked API key (first 4 + last 4 chars)")


class UpdateUserSettingsRequest(BaseModel):
    astrometry_api_key: str = Field(..., min_length=1, max_length=128, description="Astrometry.net API key")


# --- Guest Auth schemas ---

class GuestTokenResponse(BaseModel):
    token: str
    refresh_token: Optional[str] = None
    user_id: str
    public_name: str = Field(..., description="Human-readable guest identifier (e.g. 'bright-nebula-a7f2')")
    expires_in: int = Field(..., description="Token lifetime in seconds")


# Resolve forward reference
SubmissionDetailed.model_rebuild()
