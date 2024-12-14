from sqlalchemy import Column, Integer, Float
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Star(Base):
    __tablename__ = "stars"

    id = Column(Integer, primary_key=True, index=True)
    ra = Column(Float, nullable=False)
    dec = Column(Float, nullable=False)
    phot_g_mean_mag = Column(Float, nullable=True)
    phot_bp_mean_mag = Column(Float, nullable=True)
    phot_rp_mean_mag = Column(Float, nullable=True)
    nside = Column(Integer, nullable=False)
    pix = Column(Integer, nullable=False)
