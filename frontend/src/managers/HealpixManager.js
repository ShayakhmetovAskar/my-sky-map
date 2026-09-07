import * as THREE from 'three';
import { heal2equatorial, hipspix2healpix, isNorthAdjacent } from '@/utils/healpix.js';
import { isPixelVisible } from '@/utils/algos';
import { tileLoader } from '@/utils/tileLoader';
import { MeshLoader } from '@/utils/textureLoader';
import { API_CONFIG } from '@/settings/api';
import { createStarMaterial } from '@/utils/starShader.js';
import { StarsMeshLoader } from '@/utils/starGeometryLoader';
import { LRUCache } from '@/utils/LRUCache';
import { APP_SETTINGS } from '@/settings/appSettings';
import * as healpix from "@hscmap/healpix";
import LabelManager from '@/managers/LabelManager';

// Сколько звёзд на тайл остаётся кандидатами на подпись. При глубоком зуме тайлы
// глубже STARS_MAX_ORDER берут кандидатов у предка, поэтому топ-100 на предке
// оставлял тусклые звёзды вообще без шанса быть подписанными.
const LABEL_CANDIDATES_PER_TILE = 500;

// Сколько подписей одновременно на экране.
const MAX_LABELS_ON_SCREEN = 10;


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

        // Depth of the tile meshes. Raised by setUserLayer() when the My Sky layer
        // (per-image tiles composited on the client) reaches deeper than the DSS.
        this.tileMaxOrder = APP_SETTINGS.DSS_MAX_ORDER;

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
        // Звёзды и подложка расходятся по глубине: у звёзд пирамида доходит до 9,
        // у DSS-снимков — только до 7. Без отдельного среза листья уходили бы на
        // order 8-9, где textureLoader выходит по DSS_MAX_ORDER, и подложка
        // переставала грузиться совсем.
        const dssOrder = Math.min(targetOrder, this.tileMaxOrder);

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
            // Копия: для order-0 `stars` — ссылка на массив из pointsCache
            const topNbrightest = [...stars]
                .sort((a, b) => a.phot_g_mean_mag - b.phot_g_mean_mag)
                .slice(0, LABEL_CANDIDATES_PER_TILE);
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

            if (tile.order === dssOrder) {
                this.currentTiles.push(tile);
            }

            if (tile.order < targetOrder) {
                queue.push(...tile.subdivide());
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
                    return { key, stars: this.brightestStarsCache.get(key) };
                }
                if (currentTile.order === 0) {
                    break;
                }
                const parentPix = Math.floor(currentTile.pix / 4);
                const parentOrder = currentTile.order - 1;
                currentTile = { order: parentOrder, pix: parentPix };
            }
            return { key: null, stars: [] };
        };

        const allStarsMap = new Map();

        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        // Соседние тайлы часто разрешаются в один и тот же предок — его список
        // проверяем один раз, иначе рост числа кандидатов умножается на число тайлов.
        const checkedLists = new Set();
        const worldPos = new THREE.Vector3();

        for (let tile of this.currentTiles) {
            const { key, stars } = getBrightestStarsWithFallback(tile);
            if (key === null || checkedLists.has(key)) {
                continue;
            }
            checkedLists.add(key);

            for (let star of stars) {
                worldPos.copy(star.position).applyMatrix4(this.group.matrixWorld);
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
            .slice(0, MAX_LABELS_ON_SCREEN);
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

    /** Catalog stars on/off (points + their labels). */
    setStarsVisible(visible) {
        this.starsVisible = visible;
        this.tileManager.starsLoader.starMaterial.visible = visible;
    }

    /** Attach (or detach, with `null`) the My Sky layer; tile meshes then go as deep as its
     *  max order — DSS beyond DSS_MAX_ORDER falls back to parent crops in TextureLoader._getTexture. */
    setUserLayer(loader, maxOrder) {
        this.tileManager.meshLoader.setUserLayer(loader);
        this.tileManager.tileMaxOrder = Math.max(APP_SETTINGS.DSS_MAX_ORDER, maxOrder || 0);
    }

    async setOrder(camera) {
        // Пороги хвоста (7/8/9) подобраны так, чтобы в кадр попадало примерно
        // столько же тайлов, сколько на уже работающих уровнях (~36): площадь
        // ячейки падает вчетверо на уровень, поэтому fov делится пополам.
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
        } else if (camera.fov > 0.5) {
            order = 7;
        } else if (camera.fov > 0.25) {
            order = 8;
        } else {
            order = 9;
        }
        await this.tileManager.setOrder(order, camera);

        // Используем новый умный метод обновления лейблов
        const brightestStars = this.tileManager.brightestStars || [];
        this.labelManager.updateStarLabels(this.starsVisible === false ? [] : brightestStars, camera);
    }
}
