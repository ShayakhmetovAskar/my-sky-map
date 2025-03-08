import { LRUCache } from "./LRUCache";
import * as THREE from 'three';
import { heal2equatorial, hipspix2healpix, isNorthAdjacent } from '@/utils/healpix.js';

const textureLoader = new THREE.TextureLoader();


class TextureLoader {
    constructor(maxConcurrent = 5) {
        this.failureTimeoutSeconds = 10;
        this.failedUrls = new LRUCache(100);

        this.baseUrl = '/api/surveys/dss/v1';
        this.maxConcurrent = maxConcurrent;
        this.currentCount = 0;
        this.rootTextures = []

        this.textureCacheMain = new LRUCache(100);
        this.textureCacheTemp = new LRUCache(100);

        this.textureCacheMain.onEvict = (url, texture) => {
            texture.dispose();
        };

        this.textureCacheTemp.onEvict = (url, texture) => {
            texture.dispose();
        };


        for (let i = 0; i < 12; i++) {
            const texture = textureLoader.load(`/Norder0/Npix${i}.jpg`);
            this.rootTextures.push(texture);
        }

    }


    getKey(norder, pix) {
        return `${norder}/${pix}`;
    }

    getUrl(norder, pix) {
        return `${this.baseUrl}/Norder${norder}/Npix${pix}`;
    }

    /**
     * returns undefined if texture is not in cache
     */
    getTexture(norder, pix) {
        if (norder == 0) {
            return this.rootTextures[pix];
        }

        const key = this.getKey(norder, pix);

        if (this.textureCacheMain.has(key)) {
            const texture = this.textureCacheMain.get(key);
            texture.userData = true;
            return texture;
        } else {
            this.load(norder, pix);

            if (this.textureCacheTemp.has(key)) {
                const texture = this.textureCacheTemp.get(key);
                texture.userData = false;
                return texture;
            }
            const path = [];
            const texture = this._getTexture(norder, pix, path);
            this.textureCacheTemp.put(key, texture);
            texture.userData = false;
            return texture;
        }
    }

    _getTexture(norder, pix, path = []) {
        const key = this.getKey(norder, pix);

        let texture = null;

        if (norder == 0) {
            texture = this.rootTextures[pix];
        } else if (this.textureCacheMain.has(key)) {
            texture = this.textureCacheMain.get(key);
        } else {
            const parentOrder = norder - 1;
            const parentPix = Math.floor(pix / 4);
            path.push(pix % 4);
            return this._getTexture(parentOrder, parentPix, path);
        }


        let min_u = 0, max_u = 1, min_v = 0, max_v = 1;
        for (let i = path.length - 1; i >= 0; i--) {
            const delta_u = (max_u - min_u) / 2;
            const delta_v = (max_v - min_v) / 2;

            switch (path[i]) {
                case 0: // top
                    max_u -= delta_u;
                    min_v += delta_v;
                    break;
                case 1: // right
                    max_u -= delta_u;
                    max_v -= delta_v;
                    break;
                case 2: // bottom
                    min_u += delta_u;
                    min_v += delta_v;
                    break;
                case 3: // left
                    min_u += delta_u;
                    max_v -= delta_v;
                    break;
            }
        }

        if (path.length > 0) {
            texture = texture.clone();
            texture.repeat.set(max_u - min_u, max_v - min_v);
            texture.offset.set(min_u, min_v);
        } else {

        }
        return texture;
    }



    load(norder, pix) {
        const url = this.getUrl(norder, pix);
        if (this.currentCount >= this.maxConcurrent) {
            return;
        }

        // Проверяем, установлен ли таймаут для данного URL
        if (this.failedUrls.has(url)) {
            const retryTime = this.failedUrls.get(url);
            if (Date.now() < retryTime) {
                return; // ещё не прошло время блокировки
            } else {
                // Время ожидания истекло – удаляем запись
                this.failedUrls.delete(url);
            }
        }

        this.currentCount++;
        textureLoader.load(
            // url
            url,

            // onLoad callback
            (texture) => {
                this.textureCacheMain.put(this.getKey(norder, pix), texture);
                this.currentCount--;
            },

            // onProgress callback currently not supported
            undefined,

            // onError callback
            (error) => {
                const timeoutMs = this.failureTimeoutSeconds * 1000;
                this.failedUrls.put(url, Date.now() + timeoutMs);
                console.error("Ошибка загрузки текстуры:", url, error);
                this.currentCount--;
            }
        );
    }

}


export class MeshLoader {
    constructor(group) {
        this.textureLoader = new TextureLoader();
        this.meshCache = new LRUCache(100);
        this.group = group;
        this.meshCache.onEvict = (key, mesh) => {
            this.group.remove(mesh);

            mesh.geometry && mesh.geometry.dispose();
            if (mesh.material) {
                Array.isArray(mesh.material)
                    ? mesh.material.forEach(mat => mat.dispose())
                    : mesh.material.dispose();
            }
        };
    }


    loadTile(norder, pix) {
        const key = this.getKey(norder, pix);

        if (this.meshCache.has(key)) {
            return;
        }

        this.createMeshWithTexture(norder, pix);
    }

    update(currentTiles) {
        for (const [key, mesh] of this.meshCache) {
            mesh.visible = false;
        }

        for (const tile of currentTiles) {
            const order = tile.order;
            const pix = tile.pix;
            const key = this.getKey(order, pix);

            let mesh = this.meshCache.get(key);

            if (mesh?.material?.map && !mesh.material.map.userData) {
                const texture = this.textureLoader.getTexture(order, pix);
                if (texture.userData) {
                    mesh.material.map = texture;
                    mesh.material.map.needsUpdate = true;
                }
            }

            mesh = this.meshCache.get(key);

            if (mesh) {
                mesh.visible = true;
            } else {
                this.loadTile(order, pix);
            }
        }
    }


    createTileGeometry(order, pix) {
        const nside = Math.pow(2, order);
        const resolution = (order === 0) ? 25 : 11;
        const geometry = new THREE.PlaneGeometry(1, 1, resolution + 1, resolution + 1);
        const posAttr = geometry.attributes.position;

        for (let i = 0; i < posAttr.count; i++) {
            const xOrig = posAttr.getX(i);
            const yOrig = posAttr.getY(i);
            // Преобразуем координаты из диапазона [-0.5, +0.5] в [0, 1]
            const u = xOrig + 0.5;
            const v = yOrig + 0.5;

            let { ra, dec } = heal2equatorial(...hipspix2healpix(nside, pix, u, v));

            ra += Math.PI;

            const R = 10;
            const x = R * -Math.cos(dec) * Math.sin(ra);
            const y = R * Math.sin(dec);
            const z = R * -Math.cos(dec) * Math.cos(ra);
            posAttr.setXYZ(i, x, y, z);
        }

        posAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }

    createMeshWithTexture(norder, pix) {
        let texture = this.textureLoader.getTexture(norder, pix);

        const geometry = this.createTileGeometry(norder, pix);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            //wireframe: true,
            side: THREE.DoubleSide, 
            depthTest: false,
            transparent: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        this.group.add(mesh);
        this.meshCache.put(this.getKey(norder, pix), mesh);
    }


    getKey(norder, pix) {
        return `${norder}/${pix}`;
    }
}


