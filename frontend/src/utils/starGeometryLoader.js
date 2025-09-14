import { LRUCache } from "./LRUCache";
import * as THREE from 'three';
import { prepareStarsGeometryNew } from "./algos";
import { createStarMaterial } from '@/utils/starShader.js';
import { API_CONFIG } from '@/settings/api';

export class StarsMeshLoader {
    constructor(group) {
        this.group = group;
        this.jsonLoader = new JsonLoader(5);
        this.starMaterial = createStarMaterial();

        this.pointsCache = new LRUCache(100);
        this.pointsCache.onEvict = (key, entry) => {
            this.group.remove(entry.mesh);
            if (entry.mesh.geometry) {
                entry.mesh.geometry.dispose();
            }
            if (entry.mesh.material) {
                Array.isArray(entry.mesh.material)
                    ? entry.mesh.material.forEach(mat => mat.dispose())
                    : entry.mesh.material.dispose();
            }
        };
    }

    setFov(fov) {
        this.starMaterial.uniforms.fov.value = fov;
    }

    getKey(norder, pix) {
        return `${norder}/${pix}`;
    }

    getUrl(norder, pix) {
        return `${this.baseUrl}/Norder${norder}/Npix${pix}.csv`;
    }

    getMesh(norder, pix) {
        const key = this.getKey(norder, pix);

        if (this.pointsCache.has(key)) {
            return;
        }
        this.createMesh(norder, pix);
    }

    createMesh(norder, pix) {
        const csvFile = this.jsonLoader.getFile(norder, pix);
        if (!csvFile) {
            return;
        }
        const key = this.getKey(norder, pix);
        const text = csvFile;
        const {geometry, brightestStars} = prepareStarsGeometryNew(text);
        const points = new THREE.Points(geometry, this.starMaterial);
        points.renderOrder = -1000;
        
        this.group.add(points);
        
        this.pointsCache.put(key, {
            mesh: points,
            brightestStars: brightestStars
        });
    }

    getBrightestStars(norder, pix) {
        const key = this.getKey(norder, pix);
        const entry = this.pointsCache.get(key);
        return entry?.brightestStars ?? [];
    }

    update(currentTiles) {
        for (const [key, entry] of this.pointsCache) {
            entry.mesh.visible = false;
        }

        for (const tile of currentTiles) {
            const order = tile.order;
            const pix = tile.pix;
            const key = this.getKey(order, pix);
            let entry = this.pointsCache.get(key);
            if (entry?.mesh) {
                entry.mesh.visible = true;
            } else {
                this.createMesh(order, pix);
            }
        }
    }
}

export class JsonLoader {
    constructor(maxConcurrent = 5) {
        this.failureTimeoutSeconds = 10;
        this.failedUrls = new LRUCache(100);
        this.baseUrl = API_CONFIG.STARS.baseUrl;
        this.maxConcurrent = maxConcurrent;
        this.currentCount = 0;
        this.csvCache = new LRUCache(100);

        this.loadingSet = new Set();
    }

    getFile(norder, pix) {
        const key = this.getKey(norder, pix);
        const file = this.csvCache.get(key);
        if (!file) {
            this.load(norder, pix);
            return undefined;
        }
        return file;
    }

    getKey(norder, pix) {
        return `${norder}/${pix}`;
    }

    getUrl(norder, pix) {
        return `${this.baseUrl}/Norder${norder}/Npix${pix}.csv`;
    }

    load(norder, pix) {
        const url = this.getUrl(norder, pix);
        const key = this.getKey(norder, pix);

        // Если запрос ранее не удался, проверяем время повтора
        if (this.failedUrls.has(url)) {
            const retryTime = this.failedUrls.get(url);
            if (Date.now() < retryTime) {
                return; // ещё не прошло время блокировки
            } else {
                this.failedUrls.delete(url);
            }
        }

        if (this.loadingSet.has(key)) return;

        if (this.currentCount >= this.maxConcurrent) {
            return;
        }

        this.loadingSet.add(key);
        this.currentCount++;
        fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error(`Ошибка загрузки файла: ${response.status}`);
            })
            .then(text => {
                this.csvCache.put(key, text);
            })
            .catch(() => {
                const timeoutMs = this.failureTimeoutSeconds * 1000;
                this.failedUrls.put(url, Date.now() + timeoutMs);
            })
            .finally(() => {
                this.loadingSet.delete(key);
                this.currentCount--;
            });
    }
}
