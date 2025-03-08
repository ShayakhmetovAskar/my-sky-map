from pathlib import Path
from pydantic_settings import  BaseSettings
from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse


class Settings(BaseSettings):
    data_root: str

    class Config:
        env_file = ".env"


settings = Settings()
DATA_ROOT = Path(settings.data_root)

app = FastAPI()


@app.get("/surveys/dss/v1/Norder{norder}/Npix{npix}")
async def get_dss_tile(norder: int, npix: int):
    file_path = (
        DATA_ROOT
        / "surveys"
        / "dss"
        / "v1"
        / f"Norder{norder}"
        / f"Npix{npix}.jpg"
    )

    print(file_path)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, media_type="image/jpeg")


@app.get("/stars/v1/Norder{norder}/Npix{npix}")
async def get_stars_tile(norder: int, npix: int):
    file_path = (
        DATA_ROOT / "stars" / "v1" / f"Norder{norder}" / f"Npix{npix}.csv"
    )

    print(file_path)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, media_type="text/csv")
