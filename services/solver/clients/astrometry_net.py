"""HTTP client for nova.astrometry.net API.

Handles authentication, image upload, polling, and result download.
Separated from solver logic for testability — mock this client in tests.
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

POLL_INTERVAL = 5  # seconds between status checks


class AstrometryNetClient:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.base_url = self.api_url.replace("/api", "")
        self._session_key: Optional[str] = None

    async def login(self) -> str:
        """Authenticate and return session key."""
        if self._session_key:
            return self._session_key

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.api_url}/login",
                data={"request-json": json.dumps({"apikey": self.api_key})},
            )
            data = resp.json()

        if data.get("status") != "success":
            raise AstrometryApiError(f"Login failed: {data}")

        self._session_key = data["session"]
        logger.info("Authenticated with astrometry.net")
        return self._session_key

    async def upload(self, file_path: Path, session: str, hints: Optional[dict] = None) -> int:
        """Upload image file, return submission ID."""
        request_json = {
            "session": session,
            "allow_commercial_use": "n",
            "publicly_visible": "n",
        }
        if hints:
            request_json.update(hints)

        async with httpx.AsyncClient(timeout=60) as client:
            with open(file_path, "rb") as f:
                resp = await client.post(
                    f"{self.api_url}/upload",
                    data={"request-json": json.dumps(request_json)},
                    files={"file": (file_path.name, f, "application/octet-stream")},
                )
            data = resp.json()

        if data.get("status") != "success":
            raise AstrometryApiError(f"Upload failed: {data}")

        subid = data["subid"]
        logger.info("Uploaded %s → submission %s", file_path.name, subid)
        return subid

    async def wait_for_job(self, subid: int, timeout: int = 300) -> int:
        """Poll submission until a job ID appears."""
        elapsed = 0
        async with httpx.AsyncClient(timeout=30) as client:
            while elapsed < timeout:
                resp = await client.get(f"{self.api_url}/submissions/{subid}")
                data = resp.json()

                jobs = data.get("jobs", [])
                if jobs and jobs[0] is not None:
                    logger.info("Submission %s → job %s", subid, jobs[0])
                    return jobs[0]

                await asyncio.sleep(POLL_INTERVAL)
                elapsed += POLL_INTERVAL

        raise AstrometryApiError(f"Submission {subid}: no job after {timeout}s")

    async def wait_for_result(self, job_id: int, timeout: int = 300) -> None:
        """Poll job until it succeeds or fails."""
        elapsed = 0
        async with httpx.AsyncClient(timeout=30) as client:
            while elapsed < timeout:
                resp = await client.get(f"{self.api_url}/jobs/{job_id}/info")
                data = resp.json()
                status = data.get("status")

                if status == "success":
                    logger.info("Job %s solved", job_id)
                    return
                if status == "failure":
                    raise AstrometryApiError(f"Job {job_id} failed to solve")

                await asyncio.sleep(POLL_INTERVAL)
                elapsed += POLL_INTERVAL

        raise AstrometryApiError(f"Job {job_id}: not solved after {timeout}s")

    async def get_calibration(self, job_id: int) -> dict:
        """Get calibration data: ra, dec, pixscale, orientation, radius."""
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self.api_url}/jobs/{job_id}/calibration/")
            return resp.json()

    async def download_annotated_image(self, job_id: int, output_path: Path) -> None:
        """Download the annotated image (PNG)."""
        await self._download(f"{self.base_url}/annotated_display/{job_id}", output_path)

    async def download_wcs(self, job_id: int, output_path: Path) -> None:
        """Download the WCS FITS header file."""
        await self._download(f"{self.base_url}/wcs_file/{job_id}", output_path)

    async def _download(self, url: str, output_path: Path) -> None:
        """Download a file with required Referer header."""
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            resp = await client.get(url, headers={"Referer": f"{self.api_url}/login"})
            resp.raise_for_status()
            output_path.write_bytes(resp.content)
        logger.info("Downloaded %s → %s", url.split("/")[-2:], output_path.name)


class AstrometryApiError(Exception):
    """Raised when astrometry.net API returns an error."""
    pass
