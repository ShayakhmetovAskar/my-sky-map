"""Generate RA/Dec mesh grid from WCS header.

Ported from backend/services/solver/solver/getMesh.py.
Used to create a coordinate grid for 3D sky sphere rendering.
"""

from pathlib import Path

from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image


def get_mesh(n: int, m: int, image_path: str, wcs_path: str) -> list:
    """Split image into (n x m) grid and return vertices as (RA, Dec).

    Args:
        n: number of grid columns
        m: number of grid rows
        image_path: path to the original image (for dimensions)
        wcs_path: path to WCS FITS header file

    Returns:
        List of rows, each row is a list of {'ra': float, 'dec': float}
    """
    try:
        header = fits.Header.fromfile(wcs_path, endcard=False)
    except Exception:
        header = fits.Header.fromtextfile(wcs_path)

    wcs = WCS(header)

    image_w = header.get("IMAGEW")
    image_h = header.get("IMAGEH")

    if image_w is None or image_h is None:
        ext = Path(image_path).suffix.lower()
        if ext in (".fits", ".fit", ".fts"):
            with fits.open(image_path) as hdul:
                data = hdul[0].data
                if data is None:
                    raise ValueError("No image data in FITS file")
                image_h, image_w = data.shape
        else:
            with Image.open(image_path) as img:
                image_w, image_h = img.size
    else:
        image_w = int(image_w)
        image_h = int(image_h)

    xs = [i * (image_w - 1) / n for i in range(n + 1)]
    ys = [j * (image_h - 1) / m for j in range(m + 1)]

    mesh = []
    for y in ys:
        row = []
        for x in xs:
            world = wcs.all_pix2world(x, y, 0)
            ra, dec = world[0].tolist(), world[1].tolist()
            row.append({"ra": ra, "dec": dec})
        mesh.append(row)

    return mesh
