import * as THREE from 'three';
import { LRUCache } from '@/utils/LRUCache';

const DEG2RAD = Math.PI / 180;
const SEGMENTS = 512;

// Base grid: 24 meridians + 9 parallels
const BASE_MERIDIAN_STEP = 15;  // 360/15 = 24
const BASE_PARALLEL_STEP = 20;  // -80,-60,-40,-20,0,20,40,60,80

// Gap invariants (fraction of screen dimension)
const MIN_GAP = 0.15;  // gap ≥ 15% → don't subdivide too much
const MAX_GAP = 0.25;  // gap ≤ 25% → don't leave too sparse

const MIN_STEP = 0.0001; // absolute minimum step

export default class GridManager {
  constructor(root, radius = 10) {
    this.root = root;
    this.radius = radius;
    this.visible = true;
    this.group = new THREE.Group();
    this.root.add(this.group);

    this.material = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.5,
    });

    this.cache = new LRUCache(300, (_key, line) => {
      this.group.remove(line);
      line.geometry.dispose();
    });

    // Debug state
    this._debug = {};
  }

  setVisible(visible) {
    this.visible = visible;
    this.group.visible = visible;
  }

  update(fov, raDeg, decDeg, poleVisible = false) {
    if (!this.visible) return;

    const aspect = window.innerWidth / window.innerHeight;
    const halfV = fov / 2;
    const hFov = fov * aspect;

    // ── Compute parallel step via ×2 subdivision ──
    let parallelStep = BASE_PARALLEL_STEP;
    while (parallelStep / 2 / fov >= MIN_GAP && parallelStep / 2 >= MIN_STEP) {
      parallelStep /= 2;
    }

    // ── Outermost parallel (meridians stop here) ──
    const outermostParallel = Math.floor((90 - 0.001) / parallelStep) * parallelStep;

    // ── Visible Dec range (with margin for line creation) ──
    const decMin = Math.max(decDeg - halfV * 1.5, -outermostParallel);
    const decMax = Math.min(decDeg + halfV * 1.5, outermostParallel);

    // ── Compute meridian step via ×2 subdivision ──
    let meridianStep;
    if (poleVisible) {
      meridianStep = BASE_MERIDIAN_STEP; // 15° = 24 meridians
    } else {
      // Clamp extremeDec to outermost parallel — meridians don't exist beyond it
      const extremeDecVisible = Math.max(Math.abs(decDeg - halfV), Math.abs(decDeg + halfV));
      const effectiveExtremeDec = Math.min(extremeDecVisible, outermostParallel);
      const cosExtreme = Math.cos(effectiveExtremeDec * DEG2RAD);

      // minAbsDec: where meridians are widest apart
      const realDecMin = decDeg - halfV;
      const realDecMax = decDeg + halfV;
      const minAbsDec = (realDecMin < 0 && realDecMax > 0) ? 0 : Math.min(Math.abs(realDecMin), Math.abs(realDecMax));
      const cosMinDec = Math.cos(minAbsDec * DEG2RAD);

      meridianStep = BASE_MERIDIAN_STEP;
      while (meridianStep / 2 >= MIN_STEP) {
        const nextStep = meridianStep / 2;
        const nextWidest = nextStep * cosMinDec / hFov;
        const currentNarrowest = meridianStep * cosExtreme / hFov;

        if (nextWidest >= MIN_GAP) {
          // Safe to subdivide — widest gap stays ≥ 15%
          meridianStep = nextStep;
        } else if (currentNarrowest > MAX_GAP) {
          // Must subdivide — narrowest gap > 25%, too sparse
          meridianStep = nextStep;
        } else {
          break;
        }
      }
    }

    // ── Visible RA range ──
    const cosDec = Math.max(Math.cos(decDeg * DEG2RAD), 1e-10);
    const raHalf = Math.min(hFov / 2 * 1.5 / cosDec, 180);
    const raMin = raDeg - raHalf;
    const raMax = raDeg + raHalf;

    // ── Meridian Dec bounds ──
    const meridianDecMin = -outermostParallel * DEG2RAD;
    const meridianDecMax = outermostParallel * DEG2RAD;

    // ── Draw ──
    let meridianCount = 0;
    let parallelCount = 0;
    const touchedKeys = new Set();

    // Parallels: multiples of parallelStep in (-90, 90), within visible range
    const nParallels = Math.round(2 * outermostParallel / parallelStep);
    for (let i = 0; i <= nParallels; i++) {
      const dSnap = -outermostParallel + i * parallelStep;
      if (dSnap < decMin || dSnap > decMax) continue;

      const key = `p_${dSnap}`;
      touchedKeys.add(key);
      if (this.cache.has(key)) {
        this.cache.get(key);
      } else {
        this.cache.put(key, this._createParallel(dSnap * DEG2RAD));
      }
      parallelCount++;
    }

    // Meridians
    if (poleVisible) {
      for (let ra = 0; ra < 360; ra += meridianStep) {
        const key = `m_${ra}_${outermostParallel}`;
        touchedKeys.add(key);
        if (this.cache.has(key)) {
          this.cache.get(key);
        } else {
          this.cache.put(key, this._createMeridian(ra * DEG2RAD, meridianDecMin, meridianDecMax));
        }
        meridianCount++;
      }
    } else {
      const raStart = Math.ceil(raMin / meridianStep) * meridianStep;
      const raEnd = Math.floor(raMax / meridianStep) * meridianStep;
      for (let ra = raStart; ra <= raEnd; ra += meridianStep) {
        const raNorm = ((ra % 360) + 360) % 360;
        const key = `m_${raNorm}_${outermostParallel}`;
        touchedKeys.add(key);
        if (this.cache.has(key)) {
          this.cache.get(key);
        } else {
          this.cache.put(key, this._createMeridian(raNorm * DEG2RAD, meridianDecMin, meridianDecMax));
        }
        meridianCount++;
      }
    }

    // Hide untouched lines
    for (const [key, line] of this.cache) {
      line.visible = touchedKeys.has(key);
    }

    // ── Debug info ──
    const extremeDecVisible = Math.max(Math.abs(decDeg - halfV), Math.abs(decDeg + halfV));
    const effectiveExtremeDec = Math.min(extremeDecVisible, outermostParallel);
    const cosExt = Math.cos(effectiveExtremeDec * DEG2RAD);
    const realDecMin2 = decDeg - halfV;
    const realDecMax2 = decDeg + halfV;
    const minAbsDec2 = (realDecMin2 < 0 && realDecMax2 > 0) ? 0 : Math.min(Math.abs(realDecMin2), Math.abs(realDecMax2));
    const cosMin = Math.cos(minAbsDec2 * DEG2RAD);

    this._debug = {
      parallelStep,
      meridianStep,
      outermostParallel,
      poleVisible,
      cached: this.cache.cache.size,
      meridians: meridianCount,
      parallels: parallelCount,
      parallelGap: (parallelStep / fov * 100).toFixed(1),
      narrowestMGap: (meridianStep * cosExt / hFov * 100).toFixed(1),
      widestMGap: (meridianStep * cosMin / hFov * 100).toFixed(1),
      effectiveExtremeDec: effectiveExtremeDec.toFixed(1),
    };
  }

  getDebugInfo() {
    return this._debug;
  }

  _createParallel(decRad) {
    const positions = [];
    const r = this.radius;
    const cosDec = Math.cos(decRad);
    const sinDec = Math.sin(decRad);

    for (let i = 0; i <= SEGMENTS; i++) {
      const ra = (i / SEGMENTS) * Math.PI * 2;
      positions.push(
        r * -cosDec * Math.sin(ra),
        r * sinDec,
        r * -cosDec * Math.cos(ra),
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = this.material;
    const line = new THREE.Line(geo, mat);
    this.group.add(line);
    return line;
  }

  _createMeridian(raRad, decMinRad, decMaxRad) {
    const positions = [];
    const r = this.radius;
    const sinRa = Math.sin(raRad);
    const cosRa = Math.cos(raRad);

    for (let i = 0; i <= SEGMENTS; i++) {
      const dec = decMinRad + (decMaxRad - decMinRad) * (i / SEGMENTS);
      const cosDec = Math.cos(dec);
      positions.push(
        r * -cosDec * sinRa,
        r * Math.sin(dec),
        r * -cosDec * cosRa,
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = this.material;
    const line = new THREE.Line(geo, mat);
    this.group.add(line);
    return line;
  }

  dispose() {
    for (const [, line] of this.cache) {
      this.group.remove(line);
      line.geometry.dispose();
    }
    this.root.remove(this.group);
    this.material.dispose();
  }
}
