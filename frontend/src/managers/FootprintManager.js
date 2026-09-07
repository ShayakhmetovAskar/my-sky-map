import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/**
 * Outlines of the user's images on the sky.
 *
 * Exact corners come from the WCS (`image.corners`, 4 × [ra, dec] in degrees);
 * without them a square is approximated from center / field diagonal / orientation.
 * Fat lines via Line2 + LineMaterial (plain WebGL lines are always 1 px).
 *
 * Three layers: `all` (every image, when the panel toggle is on), `hover`, `selected`.
 */
const R = 9.9; // just inside the tile sphere (R = 10)
const EDGE_SEGMENTS = 12;

const STYLES = {
    all: { color: 0x42b983, opacity: 0.75, width: 2.5 },
    hover: { color: 0xffffff, opacity: 0.95, width: 3.5 },
    selected: { color: 0x42b983, opacity: 1.0, width: 5 },
};

function skyPoint(raDeg, decDeg) {
    const ra = THREE.MathUtils.degToRad(raDeg);
    const dec = THREE.MathUtils.degToRad(decDeg);
    return [R * -Math.cos(dec) * Math.sin(ra), R * Math.sin(dec), R * -Math.cos(dec) * Math.cos(ra)];
}

/** Square of side `sideDeg` around (ra, dec), rotated by `angleDeg` — fallback when corners are unknown. */
function squareCorners(raDeg, decDeg, sideDeg, angleDeg) {
    const h = sideDeg / 2;
    const a = THREE.MathUtils.degToRad(angleDeg);
    const cosDec = Math.max(0.05, Math.cos(THREE.MathUtils.degToRad(decDeg)));
    return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => {
        const east = u * Math.cos(a) - v * Math.sin(a);
        const north = u * Math.sin(a) + v * Math.cos(a);
        return { ra: raDeg + east / cosDec, dec: decDeg + north };
    });
}

/** Corners of the footprint as {ra, dec}: exact when known, square fallback otherwise. */
export function footprintCorners(image) {
    return image.corners
        ? image.corners.map(([ra, dec]) => ({ ra, dec }))
        : squareCorners(image.ra, image.dec, image.fov / Math.SQRT2, -(image.orientation || 0));
}

/**
 * Four great-circle plane normals (skyGroup-local unit vectors) bounding the footprint,
 * oriented so that the image centre is on the positive side of every plane.
 */
export function footprintPlanes(image) {
    const c = footprintCorners(image).map(({ ra, dec }) => new THREE.Vector3(...skyPoint(ra, dec)).normalize());
    const centre = new THREE.Vector3(...skyPoint(image.ra, image.dec)).normalize();
    return c.map((p, i) => {
        const n = new THREE.Vector3().crossVectors(p, c[(i + 1) % 4]).normalize();
        return n.dot(centre) < 0 ? n.negate() : n;
    });
}

function outlinePositions(image) {
    const corners = image.corners
        ? image.corners.map(([ra, dec]) => ({ ra, dec }))
        : squareCorners(image.ra, image.dec, image.fov / Math.SQRT2, -(image.orientation || 0));
    const pts = [];
    for (let i = 0; i < 4; i++) {
        const a = corners[i], b = corners[(i + 1) % 4];
        let dra = b.ra - a.ra; // shortest way around the 0/360 seam
        if (dra > 180) dra -= 360;
        if (dra < -180) dra += 360;
        for (let s = 0; s < EDGE_SEGMENTS; s++) {
            const t = s / EDGE_SEGMENTS;
            pts.push(...skyPoint(a.ra + dra * t, a.dec + (b.dec - a.dec) * t));
        }
    }
    pts.push(pts[0], pts[1], pts[2]); // close the loop
    return new Float32Array(pts);
}

export default class FootprintManager {
    constructor(group) {
        this.group = group;
        this.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.materials = {};
        for (const [name, s] of Object.entries(STYLES)) {
            const m = new LineMaterial({ color: s.color, linewidth: s.width, transparent: true, opacity: s.opacity, depthTest: false, worldUnits: false });
            m.resolution.copy(this.resolution);
            this.materials[name] = m;
        }
        this.hoverLine = null;
        this.selectedLine = null;
        this.allLines = [];
        // DOM labels (constant pixel size, clickable) projected onto the screen every frame
        this.labelEl = null;
        this.onLabelClick = null;
        this.labels = [];
        this._v = new THREE.Vector3();
        this._onResize = () => {
            this.resolution.set(window.innerWidth, window.innerHeight);
            for (const m of Object.values(this.materials)) m.resolution.copy(this.resolution);
        };
        window.addEventListener('resize', this._onResize);
    }

    _makeLine(image, styleName, renderOrder) {
        const geometry = new LineGeometry();
        geometry.setPositions(outlinePositions(image));
        const line = new Line2(geometry, this.materials[styleName]);
        line.computeLineDistances();
        line.renderOrder = renderOrder;
        this.group.add(line);
        return line;
    }

    _removeLine(line) {
        if (!line) return;
        this.group.remove(line);
        line.geometry.dispose();
    }

    setHover(image) {
        this._removeLine(this.hoverLine);
        this.hoverLine = image ? this._makeLine(image, 'hover', 52) : null;
    }

    setSelected(image) {
        this._removeLine(this.selectedLine);
        this.selectedLine = image ? this._makeLine(image, 'selected', 53) : null;
    }

    /** Outline every image (pass null / [] to clear). */
    setAll(images) {
        for (const l of this.allLines) this._removeLine(l);
        this.allLines = (images || []).map(im => this._makeLine(im, 'all', 51));
    }

    setLabelContainer(el, onLabelClick, wheelTarget = null) {
        this.labelEl = el;
        this.onLabelClick = onLabelClick;
        this.wheelTarget = wheelTarget; // canvas: wheel over a label must still zoom the sky
    }

    setLabels(images) {
        for (const { el } of this.labels) el.remove();
        this.labels = [];
        if (!this.labelEl) return;
        for (const image of images || []) {
            const el = document.createElement('div');
            el.className = 'mysky-label';
            el.textContent = image.title;
            el.style.display = 'none';
            el.addEventListener('click', (e) => { e.stopPropagation(); this.onLabelClick?.(image); });
            el.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.wheelTarget?.dispatchEvent(new WheelEvent('wheel', e));
            }, { passive: false });
            this.labelEl.appendChild(el);
            this.labels.push({ image, el });
        }
    }

    /** Corners of the footprint as {ra, dec} (exact when known, square fallback otherwise). */
    _corners(image) {
        return image.corners
            ? image.corners.map(([ra, dec]) => ({ ra, dec }))
            : squareCorners(image.ra, image.dec, image.fov / Math.SQRT2, -(image.orientation || 0));
    }

    /** Call once per frame: puts each label just above the top edge of its outline on screen. */
    update(camera, width, height) {
        if (!this.labels.length) return;
        const m = this.group.matrixWorld;
        for (const { image, el } of this.labels) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, hidden = false;
            for (const c of this._corners(image)) {
                const v = this._v.set(...skyPoint(c.ra, c.dec)).applyMatrix4(m);
                if (v.clone().applyMatrix4(camera.matrixWorldInverse).z > 0) { hidden = true; break; } // behind the camera
                v.project(camera);
                const x = (v.x + 1) / 2 * width;
                const y = (1 - v.y) / 2 * height;
                minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y);
            }
            const cx = (minX + maxX) / 2;
            if (hidden || minY < 8 || minY > height || cx < 0 || cx > width) { el.style.display = 'none'; continue; }
            el.style.display = '';
            el.style.transform = `translate(${cx.toFixed(1)}px, ${minY.toFixed(1)}px) translate(-50%, -120%)`;
        }
    }

    dispose() {
        window.removeEventListener('resize', this._onResize);
        this.setAll(null);
        this.setLabels(null);
        this.setHover(null);
        this.setSelected(null);
        for (const m of Object.values(this.materials)) m.dispose();
    }
}
