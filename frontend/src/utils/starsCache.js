import QuickLRU from 'quick-lru';
import * as THREE from 'three';

const maxElements = [12, 12, 50, 50, 150, 150, 150, 150, 150, 150, 150, 150];

const starCache = maxElements.map(maxSize => new QuickLRU({
    maxSize,
    onEviction: (key, points) => {
        if (points && points instanceof THREE.Points) {
            if (points.parent) {
                points.parent.remove(points);
            }

            if (points.geometry) {
                points.geometry.dispose();
            }

            if (points.material) {
                if (Array.isArray(points.material)) {
                    points.material.forEach(m => m.dispose());
                } else {
                    points.material.dispose();
                }
            }
        }
    }
}));

export function addStarList(nside, pixel, stars) {
    const lod = Math.log2(nside);
    starCache[lod].set(pixel, stars);
}

export function hasData(nside, pixel) {
    const lod = Math.log2(nside);
    return starCache[lod].has(pixel);
}

export function getStars(nside, pixel) {
    const lod = Math.log2(nside);
    return starCache[lod].get(pixel) || [];
}
