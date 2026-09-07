import * as THREE from 'three';
import { LRUCache } from './LRUCache';

/**
 * User sky layer built from PER-IMAGE tile sets (`GET /me/sky`).
 *
 * Every solved image has its own HiPS pyramid (`image.base` + `image.moc`). For a
 * visible cell (order, pix) we take the tiles of every enabled image covering it and
 * composite them on a 512x512 canvas (coarse pixel scale first, fine on top) into one
 * CanvasTexture. Per-image visibility, collections and deletion are therefore just
 * list operations on the client; the server never merges anything.
 *
 * Interface expected by MeshLoader: getTexture(order, pix) -> texture | null with
 * `.offset/.repeat` (identity here) and `.userData === true` once every contributing
 * tile is the real one (not an ancestor crop).
 */
const TILE = 512;
const MAX_CONCURRENT = 8;
const RETRY_MS = 20000;

export class UserHipsCompositeLoader {
    constructor(images) {
        this.images = [];
        this.enabled = new Set();
        this.maxOrder = 0;
        this.tiles = new LRUCache(600);      // `${id}/${order}/${pix}` -> HTMLImageElement
        this.loading = new Set();
        this.failed = new LRUCache(200);
        this.inflight = 0;
        this.queue = [];
        this.composites = new LRUCache(300); // `${order}/${pix}` -> { canvas, ctx, texture, state }
        this.composites.onEvict = (key, c) => c.texture.dispose();
        this.coverCache = new Map();         // `${order}/${pix}` -> images covering it (for the current enabled set)
        this.disposed = false;
        this.setImages(images);
    }

    /**
     * Replace the image list (initial load or a refresh of `GET /me/sky`).
     *
     * Images without tiles yet (`status: "tiling"`) carry no `moc`/`base` and are
     * skipped: they are listed in the panel with a spinner, not drawn. MOC keys come
     * from JSON as strings; `kmax` falls back to the deepest order present in the MOC.
     * Resets visibility to "everything on" — the caller re-applies its hidden set.
     */
    setImages(images) {
        this.images = (images || [])
            .filter(im => im && im.base && im.moc)
            .map(im => ({
                ...im,
                base: String(im.base).replace(/\/+$/, ''),
                mocSets: Object.fromEntries(Object.entries(im.moc).map(([k, v]) => [Number(k), new Set(v)])),
                kmax: im.kmax ?? Math.max(0, ...Object.keys(im.moc).map(Number)),
            }));
        this.maxOrder = Math.max(0, ...this.images.map(im => im.kmax));
        this.enabled = new Set(this.images.map(im => im.id));
        this.coverCache.clear();
        for (const [, c] of this.composites) c.state = null; // the covering set changed everywhere
    }

    /** Which images are drawn; anything not in `ids` is hidden. */
    setEnabled(ids) {
        this.enabled = new Set(ids);
        this.coverCache.clear();
        for (const [, c] of this.composites) c.state = null; // force rebuild on next request
    }

    _covers(im, order, pix) {
        const level = Math.min(order, im.kmax);
        const p = pix >> (2 * (order - level));
        return im.mocSets[level]?.has(p) ?? false;
    }

    coveringImages(order, pix) {
        const key = `${order}/${pix}`;
        let list = this.coverCache.get(key);
        if (!list) {
            list = this.images
                .filter(im => this.enabled.has(im.id) && this._covers(im, order, pix))
                .sort((a, b) => b.pixscale - a.pixscale); // coarse first, fine on top
            this.coverCache.set(key, list);
        }
        return list;
    }

    // ---- tile fetching -------------------------------------------------------

    _tileKey(im, order, pix) { return `${im.id}/${order}/${pix}`; }

    _request(im, order, pix) {
        const key = this._tileKey(im, order, pix);
        if (this.tiles.has(key) || this.loading.has(key)) return;
        const until = this.failed.get(key);
        if (until && Date.now() < until) return;
        this.loading.add(key);
        this.queue.push({ im, order, pix, key });
        this._pump();
    }

    _pump() {
        if (this.disposed) return;
        while (this.inflight < MAX_CONCURRENT && this.queue.length) {
            const { im, order, pix, key } = this.queue.shift();
            this.inflight++;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => { this.tiles.put(key, img); this.loading.delete(key); this.inflight--; this._pump(); };
            img.onerror = () => { this.failed.put(key, Date.now() + RETRY_MS); this.loading.delete(key); this.inflight--; this._pump(); };
            img.src = `${im.base}/Norder${order}/Npix${pix}.png`;
        }
    }

    /** Closest loaded tile of `im` at or above (order, pix) within its coverage; requests the exact one. */
    _bestSource(im, order, pix) {
        const level = Math.min(order, im.kmax);
        let o = level, p = pix >> (2 * (order - level));
        this._request(im, o, p);
        while (o >= 0) {
            if (im.mocSets[o]?.has(p)) {
                const tile = this.tiles.get(this._tileKey(im, o, p));
                if (tile) return { tile, srcOrder: o, srcPix: p };
            }
            if (o === 0) break;
            p >>= 2; o--;
        }
        return null;
    }

    // ---- compositing ---------------------------------------------------------

    /** Sub-rectangle (canvas px) of the source tile at srcOrder that corresponds to cell (order, pix). */
    static _subRect(order, pix, srcOrder) {
        let min_u = 0, max_u = 1, min_v = 0, max_v = 1;
        for (let o = srcOrder + 1; o <= order; o++) {
            const digit = (pix >> (2 * (order - o))) & 3;
            const du = (max_u - min_u) / 2, dv = (max_v - min_v) / 2;
            switch (digit) { // same quadrant convention as TextureLoader._getTexture
                case 0: max_u -= du; min_v += dv; break;
                case 1: max_u -= du; max_v -= dv; break;
                case 2: min_u += du; min_v += dv; break;
                case 3: min_u += du; max_v -= dv; break;
            }
        }
        // v is texture space (0 = bottom); canvas rows start at the top
        return { sx: min_u * TILE, sy: (1 - max_v) * TILE, sw: (max_u - min_u) * TILE, sh: (max_v - min_v) * TILE };
    }

    getTexture(order, pix) {
        const imgs = this.coveringImages(order, pix);
        if (!imgs.length) return null;

        const sources = imgs.map(im => ({ im, src: this._bestSource(im, order, pix) }));
        const state = sources.map(s => (s.src ? `${s.im.id}:${s.src.srcOrder}/${s.src.srcPix}` : `${s.im.id}:-`)).join('|');
        if (!sources.some(s => s.src)) return null; // nothing loaded yet for this cell

        const key = `${order}/${pix}`;
        let c = this.composites.get(key);
        if (!c) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = TILE;
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.LinearSRGBColorSpace; // photo values as authored (see APO-80 findings)
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.generateMipmaps = true;
            c = { canvas, ctx: canvas.getContext('2d'), texture, state: null };
            this.composites.put(key, c);
        }
        if (c.state !== state) {
            c.ctx.clearRect(0, 0, TILE, TILE);
            for (const { src } of sources) {
                if (!src) continue;
                const r = UserHipsCompositeLoader._subRect(order, pix, src.srcOrder);
                c.ctx.drawImage(src.tile, r.sx, r.sy, r.sw, r.sh, 0, 0, TILE, TILE);
            }
            c.texture.needsUpdate = true;
            c.state = state;
            const final = sources.every(s => s.src && s.src.srcOrder === Math.min(order, s.im.kmax));
            c.texture.userData = final ? true : state;
        }
        return c.texture;
    }

    dispose() {
        this.disposed = true;
        this.queue = [];
        for (const [, c] of this.composites) c.texture.dispose();
        this.composites = new LRUCache(1);
    }
}
