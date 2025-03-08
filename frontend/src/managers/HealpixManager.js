import * as THREE from 'three';
import { heal2equatorial, hipspix2healpix, isNorthAdjacent } from '@/utils/healpix.js';
import { isPixelVisible } from '@/utils/algos';
import { tileLoader } from '@/utils/tileLoader';
import { MeshLoader } from '@/utils/textureLoader';
import { createStarMaterial } from '@/utils/starShader.js';
import { StarsMeshLoader } from '@/utils/starGeometryLoader';
import { LRUCache } from '@/utils/LRUCache';


class HealpixTile {
    constructor(order, pix) {
        this.order = order;
        this.pix = pix;
        this.mesh = null;
        this.points = null;
    }

    subdivide() {
        let children = []
        for (let i = 0; i < 4; i++) {
            const childPix = this.pix * 4 + i;
            const childOrder = this.order + 1;
            const childTile = new HealpixTile(childOrder, childPix);

            children.push(childTile);
        }
        return children;
    }
}


class TileManager {
    constructor(group, baseUrl) {
        this.dss_tiles = new THREE.Group();
        this.stars_tiles = group;
        // this.stars_tiles.renderOrder = 20;
        // this.dss_tiles.renderOrder = 40;
        group.add(this.dss_tiles);
        //group.add(this.stars_tiles);
        this.baseUrlDss = baseUrl;
        this.baseUrlStars = '/api/stars/v1';

        this.meshLoader = new MeshLoader(this.dss_tiles);
        this.starsLoader = new StarsMeshLoader(this.stars_tiles);

        this.rootTiles = [];
        for (let pix = 0; pix < 12; pix++) {
            const tile = new HealpixTile(0, pix);
            this.rootTiles.push(tile);
        }
        this.currentTiles = [];

    }

    async setOrder(targetOrder, camera) {
        this.currentTiles = [];
        const allTiles = [];
        const queue = [...this.rootTiles];

        while (queue.length > 0) {
            const tile = queue.shift();
            if (!isPixelVisible(tile.order, tile.pix, camera, true)) {
                continue;
            }
            allTiles.push(tile);

            if (tile.order < targetOrder) {
                queue.push(...tile.subdivide());
            } else {
                this.currentTiles.push(tile);
            }
        }

        this.dss_tiles.parent.children[0].intensity = (camera.fov < 20 ? 1 : camera.fov > 50 ? 0.4 : 1 - ((camera.fov - 20) / 30) * 0.6);
        this.meshLoader.update(this.currentTiles);

        this.starsLoader.update(allTiles);
        this.starsLoader.setFov(camera.fov);
    }
}


export default class HealpixManager {
    /**
     * @param {THREE.Scene} scene — сцена, куда добавляется группа тайлов
     * @param {string} [baseUrl='/surveys/dss/v1'] — базовый URL для текстур с бекенда
     */
    constructor(scene, baseUrl = '/api/surveys/dss/v1') {
        this.scene = scene;
        this.baseUrl = baseUrl;
        this.managerGroup = scene;
        this.tileManager = new TileManager(this.managerGroup, this.baseUrl);
    }

    async update() {
     
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
    }
}

