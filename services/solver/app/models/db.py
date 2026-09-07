"""SQLAlchemy ORM models for Solver service."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    status = Column(
        Enum("pending", "uploaded", "processing", "completed", "failed", name="submission_status"),
        nullable=False,
        default="pending",
    )
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    object_key = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tasks = relationship("Task", back_populates="submission", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, nullable=False, index=True)
    status = Column(
        Enum("pending", "processing", "completed", "failed", "cancelled", name="task_status"),
        nullable=False,
        default="pending",
    )
    options = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    error_code = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    submission = relationship("Submission", back_populates="tasks")

    @property
    def error(self):
        if self.error_code:
            return {"code": self.error_code, "message": self.error_message}
        return None


class Collection(Base):
    """User-defined group of solved images (My Sky). See docs/my-sky-collections-sharing.md §3."""

    __tablename__ = "collections"
    __table_args__ = (
        Index(
            "uq_collections_share_token",
            "share_token",
            unique=True,
            postgresql_where=text("share_token IS NOT NULL"),
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String(80), nullable=False)
    share_token = Column(String(32), nullable=True)
    # Guest-owned collections only: share time + 30 days, extended by owner activity.
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    items = relationship(
        "CollectionItem",
        back_populates="collection",
        order_by="CollectionItem.position",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CollectionItem(Base):
    __tablename__ = "collection_items"

    collection_id = Column(UUID(as_uuid=True), ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True, index=True)
    position = Column(Integer, nullable=False)

    collection = relationship("Collection", back_populates="items")


class StarCatalog(Base):
    __tablename__ = "star_catalog"

    source_id = Column(String, primary_key=True)

    # Catalog identifiers
    proper_name = Column(String, nullable=True, index=True)
    hip_id = Column(Integer, nullable=True, index=True)
    hd_id = Column(Integer, nullable=True)
    hr_id = Column(Integer, nullable=True)
    sao_id = Column(Integer, nullable=True)
    tyc_id = Column(String, nullable=True)
    bd_id = Column(String, nullable=True)
    gcrv_id = Column(Integer, nullable=True)
    bayer = Column(String, nullable=True)
    flamsteed = Column(String, nullable=True)
    constellation = Column(String, nullable=True)

    # Astrometry
    ra = Column(Float, nullable=True)
    dec = Column(Float, nullable=True)
    parallax = Column(Float, nullable=True)
    distance_ly = Column(Float, nullable=True)
    pm_ra = Column(Float, nullable=True)
    pm_dec = Column(Float, nullable=True)
    radial_velocity = Column(Float, nullable=True)

    # Photometry
    mag_v = Column(Float, nullable=True)
    mag_b = Column(Float, nullable=True)
    mag_g = Column(Float, nullable=True)
    mag_bp = Column(Float, nullable=True)
    mag_rp = Column(Float, nullable=True)
    abs_mag = Column(Float, nullable=True)
    color_bv = Column(Float, nullable=True)

    # Physical characteristics
    spectral_type = Column(String, nullable=True)
    temperature = Column(Float, nullable=True)
    luminosity = Column(Float, nullable=True)
    mass = Column(Float, nullable=True)
    radius = Column(Float, nullable=True)
    age = Column(Float, nullable=True)

    # Classification
    object_type = Column(String, nullable=True)
    variability_type = Column(String, nullable=True)
    variability_period = Column(Float, nullable=True)

    # Metadata
    source = Column(String, nullable=False, default="iau")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    aliases = relationship("StarAlias", back_populates="star", cascade="all, delete-orphan")


class StarAlias(Base):
    __tablename__ = "star_aliases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String, ForeignKey("star_catalog.source_id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(String, nullable=False, index=True)
    catalog = Column(String, nullable=True)

    star = relationship("StarCatalog", back_populates="aliases")
