import * as THREE from 'three';
import { heal2equatorial, hipspix2healpix, isNorthAdjacent } from '@/utils/healpix.js';
import { isPixelVisible } from '@/utils/algos';
import { tileLoader } from '@/utils/tileLoader';
import { MeshLoader } from '@/utils/textureLoader';
import { API_CONFIG } from '@/settings/api';
import { createStarMaterial } from '@/utils/starShader.js';
import { StarsMeshLoader } from '@/utils/starGeometryLoader';
import { LRUCache } from '@/utils/LRUCache';
import * as healpix from "@hscmap/healpix";
import LabelManager from '@/managers/LabelManager';

class HealpixTile {
    constructor(order, pix) {
        this.order = order;
        this.pix = pix;
        this.mesh = null;
        this.points = null;
        this.brightestStars = [];
        this.ownStars = [];
        this.allStars = [];
    }

    subdivide() {
        let children = [];
        for (let i = 0; i < 4; i++) {
            const childPix = this.pix * 4 + i;
            const childOrder = this.order + 1;
            const childTile = new HealpixTile(childOrder, childPix);
            children.push(childTile);
        }

        if (this.ownStars) {

        }

        // const childOrder = this.order + 1;
        // const nside = 1 << childOrder; // 2^childOrder
        // for (let star of this.brightestStars) {
        //     const theta = (90 - star.dec) * Math.PI / 180;
        //     const phi = star.ra * Math.PI / 180;
        //     const childPix = healpix.ang2pix_nest(nside, theta, phi);
        //     const i = childPix & 3;
        //     children[i].brightestStars.push(star);
        // }
        return children;
    }
}

class TileManager {
    constructor(group, baseUrl) {
        this.dss_tiles = group;
        this.stars_tiles = group;
        this.group = group;
        this.baseUrlDss = API_CONFIG.DSS_SURVEYS.baseUrl;
        this.baseUrlStars = API_CONFIG.STARS.baseUrl;

        this.meshLoader = new MeshLoader(this.dss_tiles);
        this.starsLoader = new StarsMeshLoader(this.stars_tiles);

        this.rootTiles = [];
        for (let pix = 0; pix < 12; pix++) {
            const tile = new HealpixTile(0, pix);
            this.rootTiles.push(tile);
        }
        this.currentTiles = [];
        this.prevAllTilesKeys = null;

        this.allStarsCache = new LRUCache(1000);
        this.brightestStarsCache = new LRUCache(1000);
    }



    async setOrder(targetOrder, camera) {
        this.currentTiles = [];
        const allTiles = [];
        const queue = [...this.rootTiles];

        const distributeStarsToChildren = (stars, order) => {
            const childOrder = order + 1;
            const nside = 1 << childOrder;
            const childStars = { child0: [], child1: [], child2: [], child3: [] };
            for (let star of stars) {
                const theta = (90 - star.dec) * Math.PI / 180;
                const phi = star.ra * Math.PI / 180;
                const childPix = healpix.ang2pix_nest(nside, theta, phi);
                const localI = childPix & 3;
                childStars[`child${localI}`].push(star);
            }
            return childStars;
        };

        const cacheTileStars = (tile, stars) => {
            const key = `${tile.order}-${tile.pix}`;
            const childStars = distributeStarsToChildren(stars, tile.order);
            this.allStarsCache.put(key, childStars);
            const topNbrightest = stars
                .sort((a, b) => a.phot_g_mean_mag - b.phot_g_mean_mag)
                .slice(0, 100);
            this.brightestStarsCache.put(key, topNbrightest);
        };

        while (queue.length > 0) {
            const tile = queue.shift();
            const key = `${tile.order}-${tile.pix}`;

            if (!isPixelVisible(tile.order, tile.pix, camera, this.group, true)) {
                continue;
            }

            if (!this.allStarsCache.has(key)) {
                let tileStars;
                if (tile.order === 0) {
                    tileStars = this.starsLoader.getBrightestStars(tile.order, tile.pix);
                    if (tileStars.length !== 0) {
                        cacheTileStars(tile, tileStars);
                    }
                } else {
                    const parentPix = Math.floor(tile.pix / 4);
                    const parentKey = `${tile.order - 1}-${parentPix}`;
                    tileStars = this.starsLoader.getBrightestStars(tile.order, tile.pix);
                    if (tileStars.length !== 0 && this.allStarsCache.has(parentKey)) {
                        const parentStars = this.allStarsCache.get(parentKey)[`child${tile.pix & 3}`] || [];
                        const combinedStars = [...tileStars, ...parentStars];
                        if (combinedStars.length > 0) {
                            cacheTileStars(tile, combinedStars);
                        }
                    }
                }
            }

            allTiles.push(tile);

            if (tile.order < targetOrder) {
                queue.push(...tile.subdivide());
            } else {
                this.currentTiles.push(tile);
            }
        }

        this.meshLoader.update(this.currentTiles);
        this.starsLoader.update(allTiles);
        this.starsLoader.setFov(camera.fov);

        const getBrightestStarsWithFallback = (tile) => {
            let currentTile = { order: tile.order, pix: tile.pix };
            while (currentTile.order >= 0) {
                const key = `${currentTile.order}-${currentTile.pix}`;
                if (this.brightestStarsCache.has(key)) {
                    return this.brightestStarsCache.get(key);
                }
                if (currentTile.order === 0) {
                    break;
                }
                const parentPix = Math.floor(currentTile.pix / 4);
                const parentOrder = currentTile.order - 1;
                currentTile = { order: parentOrder, pix: parentPix };
            }
            return [];
        };

        const allStarsMap = new Map();

        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        for (let tile of this.currentTiles) {
            const brightestStars = getBrightestStarsWithFallback(tile);
            for (let star of brightestStars) {
                const worldPos = star.position.clone().applyMatrix4(this.group.matrixWorld);
                if (frustum.containsPoint(worldPos)) {
                    const starKey = `${star.ra}-${star.dec}`;
                    if (!allStarsMap.has(starKey)) {
                        allStarsMap.set(starKey, star);
                    }
                }
            }
        }

        this.brightestStars = Array.from(allStarsMap.values())
            .sort((a, b) => a.phot_g_mean_mag - b.phot_g_mean_mag)
            .slice(0, 10);
    }
}

export default class HealpixManager {
    constructor(scene, labelManager, baseUrl = API_CONFIG.DSS_SURVEYS.baseUrl) {
        this.scene = scene;
        this.baseUrl = baseUrl;
        this.managerGroup = scene;
        this.tileManager = new TileManager(this.managerGroup, this.baseUrl);

        // Используем переданный LabelManager
        this.labelManager = labelManager;
    }



    async update() {
        // Placeholder for update logic if needed
    }

    async setOrder(camera) {
        let order = 0;
        if (camera.fov > 80) {
            order = 0;
        } else if (camera.fov > 30) {
            order = 1;
        } else if (camera.fov > 20) {
            order = 2;
        } else if (camera.fov > 5) {
            order = 3;
        } else if (camera.fov > 3) {
            order = 4;
        } else if (camera.fov > 2) {
            order = 5;
        } else if (camera.fov > 1) {
            order = 6;
        } else if (camera.fov > 0.75) {
            order = 7;
        } else {
            order = 7;
        }
        await this.tileManager.setOrder(order, camera);

        // Используем новый умный метод обновления лейблов
        const brightestStars = this.tileManager.brightestStars || [];
        this.labelManager.updateStarLabels(brightestStars, camera);
    }
}
