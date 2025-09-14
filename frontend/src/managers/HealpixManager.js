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
    constructor(scene, baseUrl = API_CONFIG.DSS_SURVEYS.baseUrl) {
        this.scene = scene;
        this.baseUrl = baseUrl;
        this.managerGroup = scene;
        this.tileManager = new TileManager(this.managerGroup, this.baseUrl);
        // Create a group for labels and add it to the scene
        this.labelsGroup = new THREE.Group();
        this.scene.add(this.labelsGroup);

        this.nameCache = new LRUCache(500);
        this.pendingLookups = new Set()

        this.labelsCache = new LRUCache(100, (key, sprite) => {
            if (sprite) {
                // Dispose of the sprite's material and texture
                if (sprite.material && sprite.material.map) {
                    sprite.material.map.dispose();
                }
                if (sprite.material) {
                    sprite.material.dispose();
                }
                // Note: Do not dispose of the sprite itself, as it's a THREE.Object3D
            }
        });

    }

    async fetchAndCacheStarName(source_id) {
        if (this.nameCache.has(source_id) || this.pendingLookups.has(source_id)) return;

        if (this.pendingLookups.size > 5) {
            return;
        }

        this.pendingLookups.add(source_id);
        try {
            const res = await fetch(`/api/star/${source_id}`);
            const data = await res.json();
            if (data?.ProperName) {
                this.nameCache.put(source_id, data.ProperName);
            } else {
                this.nameCache.put(source_id, null);
            }
        } catch (e) {
            console.error('Ошибка при получении имени звезды:', e);
        } finally {
            this.pendingLookups.delete(source_id);
        }
    }

    // Function to create a text sprite from a given string
    createTextSprite(text, color = 'white', fontSize = 6, scaleFactor = 4) {

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const largeFontSize = fontSize * scaleFactor; // Increase font size for clarity
        context.font = `${largeFontSize}px Arial`;
        const textWidth = context.measureText(text).width;
        const padding = 10 * scaleFactor;
        canvas.width = textWidth + padding;
        canvas.height = largeFontSize + padding;
        context.font = `${largeFontSize}px Arial`; // Set font again after resizing
        context.fillStyle = color;
        context.fillText(text, padding / 2, largeFontSize + padding / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        const sprite = new THREE.Sprite(spriteMaterial);
        const spriteScale = 1 / scaleFactor; // Scale down the sprite
        sprite.scale.set((textWidth + padding) / 10 * spriteScale, (largeFontSize + padding) / 10 * spriteScale, 1);

        //this.labelsCache.put(text, sprite);

        return sprite;
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
        } else if (camera.fov > 1) {
            order = 5;
        } else if (camera.fov > 0.5) {
            order = 6;
        } else if (camera.fov > 0.25) {
            order = 7;
        } else {
            order = 8;
        }
        await this.tileManager.setOrder(order, camera);



        const brightestStars = this.tileManager.brightestStars || [];

        // Очищаем старые метки
        this.labelsGroup.clear();

        const scalingFactor = camera.fov / 120;

        for (const star of this.tileManager.brightestStars || []) {
            let name = this.nameCache.get(star.source_id);

            if (name === undefined) {
                this.fetchAndCacheStarName(star.source_id); // Запускаем в фоне
                continue; // Не отрисовываем
            }

            if (!name) {
                name = star.phot_g_mean_mag.toString();
            }

            const sprite = this.createTextSprite(name);
            sprite.position.copy(new THREE.Vector3(...star.position));
            sprite.center.set(0, 0.5);
            sprite.scale.multiplyScalar(scalingFactor);
            this.labelsGroup.add(sprite);
        }
    }
}