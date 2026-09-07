import { footprintCorners } from '@/managers/FootprintManager';

/**
 * Unit vector for (ra, dec) in degrees, in the scene frame.
 * Same convention as `ControlsManager._skyDirection` and `FootprintManager.skyPoint`.
 */
export function skyUnit(raDeg, decDeg) {
    const ra = raDeg * Math.PI / 180, dec = decDeg * Math.PI / 180;
    return [-Math.cos(dec) * Math.sin(ra), Math.sin(dec), -Math.cos(dec) * Math.cos(ra)];
}

/** Extra room around the bounding cap, so outlines are not flush with the screen edge. */
const MARGIN = 1.3;

/**
 * Centre and vertical fov that fit a whole collection on screen.
 *
 * Every footprint *corner* goes into the set (not just the centres — a wide field at
 * the edge would otherwise be cut off), the centroid of those unit vectors is the
 * viewing direction, and the angle out to the farthest point is the radius of the
 * smallest cap around them. Returns `null` when there is nothing to fit.
 *
 * Degenerate case: photos spread evenly over the whole sky sum to ~zero, and there is
 * no "centre" to find — the widest view on the first image is as good as any.
 *
 * @param {Array} images  `SkyImage`-shaped: ra, dec, fov in degrees, optional `corners`.
 * @param {number} maxFov Widest fov the camera allows, used for the degenerate case.
 * @returns {{ra: number, dec: number, fov: number}|null}
 */
export function fitAllView(images, maxFov = 120) {
    const pts = [];
    let first = null;
    for (const im of images || []) {
        if (!Number.isFinite(im?.ra) || !Number.isFinite(im?.dec)) continue;
        if (!first) first = im;
        pts.push(skyUnit(im.ra, im.dec));
        // a `tiling` image has no corners yet; footprintCorners falls back to a square
        if (Number.isFinite(im.fov)) {
            for (const c of footprintCorners(im)) pts.push(skyUnit(c.ra, c.dec));
        }
    }
    if (!pts.length) return null;

    let sx = 0, sy = 0, sz = 0;
    for (const [x, y, z] of pts) { sx += x; sy += y; sz += z; }
    const n = Math.hypot(sx, sy, sz);
    if (n < 1e-6) return { ra: first.ra, dec: first.dec, fov: maxFov };

    const cx = sx / n, cy = sy / n, cz = sz / n;
    let maxAng = 0;
    for (const [x, y, z] of pts) {
        maxAng = Math.max(maxAng, Math.acos(Math.min(1, Math.max(-1, cx * x + cy * y + cz * z))));
    }

    const dec = Math.asin(Math.min(1, Math.max(-1, cy))) * 180 / Math.PI;
    let ra = Math.atan2(-cx, -cz) * 180 / Math.PI;
    if (ra < 0) ra += 360;
    return { ra, dec, fov: Math.min(maxFov, maxAng * 2 * MARGIN * 180 / Math.PI) };
}
