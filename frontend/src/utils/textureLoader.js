import { LRUCache } from "./LRUCache";
import * as THREE from 'three';
import { heal2equatorial, hipspix2healpix, isNorthAdjacent } from '@/utils/healpix.js';
import { API_CONFIG } from '@/settings/api';
import { vertexShader as dssTileVertex, fragmentShader as dssTileFragment } from '@/shaders/dssTile';
import APP_SETTINGS from '@/settings/appSettings';
import debugSettings from '@/settings/debugSettings.js';
import { createTileBoundsGeometry } from '@/utils/algos.js';

const textureLoader = new THREE.TextureLoader();


class TextureLoader {
    constructor(maxConcurrent = 10) {
        this.failureTimeoutSeconds = 20;
        this.failedUrls = new LRUCache(100);

        this.baseUrl = API_CONFIG.DSS_SURVEYS.baseUrl;
        this.maxOrder = APP_SETTINGS.DSS_MAX_ORDER; // SPIKE APO-80: overridable per layer
        // SPIKE APO-80: DSS tiles are decoded sRGB->linear on sampling, but dssTile shader
        // never re-encodes, so they render dark. A user photo must keep its raw values.
        this.textureColorSpace = THREE.SRGBColorSpace;
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
            const texture = textureLoader.load(
                `/Norder0/Npix${i}.jpg`,
                // onLoad callback
                (loadedTexture) => {
                    // Настройки применяются только после загрузки
                    loadedTexture.colorSpace = THREE.SRGBColorSpace;
                    loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
                    loadedTexture.magFilter = THREE.LinearFilter;
                    loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
                    loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
                    loadedTexture.generateMipmaps = true;
                    // Обновляем только после полной загрузки
                    loadedTexture.needsUpdate = true;
                },
                // onProgress callback
                undefined,
                // onError callback
                (error) => {
                    console.error(`Failed to load root texture Npix${i}.jpg:`, error);
                }
            );
            
            // Базовые настройки для немедленного использования
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;

            this.rootTextures.push(texture);
        }

    }


    getKey(norder, pix) {
        return `${norder}/${pix}`;
    }

    // Изменение функции getUrl для формирования нового URL картинок
    getUrl(norder, pix) {
        return `${this.baseUrl}/Norder${norder}/Npix${pix}.jpg`;
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
        // Проверяем максимальный order для этого слоя
        if (norder > this.maxOrder) {
            return; // Не загружаем изображения выше максимального order
        }
        
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
                // Проверяем, что изображение действительно загружено
                if (texture.image && texture.image.complete) {
                    texture.colorSpace = this.textureColorSpace;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.generateMipmaps = true;
                    
                    // Обновляем текстуру только после полной загрузки изображения
                    texture.needsUpdate = true;
                    this.textureCacheMain.put(this.getKey(norder, pix), texture);
                } else {
                    console.warn(`Texture loaded but image data not complete for ${url}`);
                }
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


// ---------------------------------------------------------------------------
// SPIKE APO-80: loader for a sparse user HiPS layer (RGBA PNG tiles + MOC).
// Same parent-fallback idea as TextureLoader, but gated by coverage: a cell
// outside the MOC is never requested, and if nothing up the chain is loaded
// yet we return null (tile draws without the layer) instead of a root texture.
// ---------------------------------------------------------------------------
export class UserHipsTextureLoader extends TextureLoader {
    constructor(baseUrl, moc, maxOrder, maxConcurrent = 4) {
        super(maxConcurrent);
        this.baseUrl = baseUrl;
        this.maxOrder = maxOrder;
        // moc: { [order]: Set(pix) }
        this.moc = moc;
        this.rootTextures = []; // no all-sky roots for a user layer
        this.textureColorSpace = THREE.LinearSRGBColorSpace; // no decode: photo shows as authored
    }

    has(norder, pix) {
        const s = this.moc[norder];
        return s ? s.has(pix) : false;
    }

    getUrl(norder, pix) {
        return `${this.baseUrl}/Norder${norder}/Npix${pix}.png`;
    }

    load(norder, pix) {
        if (!this.has(norder, pix)) return;
        super.load(norder, pix);
    }

    getTexture(norder, pix) {
        const key = this.getKey(norder, pix);
        if (this.textureCacheMain.has(key)) {
            const texture = this.textureCacheMain.get(key);
            texture.userData = true;
            return texture;
        }
        // closest loaded covered ancestor (requests the missing ones on the way up)
        const found = this._resolve(norder, pix, []);
        if (!found) return null;
        const cached = this.textureCacheTemp.get(key);
        if (cached && cached.userData === found.sourceKey) {
            return cached;
        }
        const texture = this._crop(found.texture, found.path);
        texture.userData = found.sourceKey; // which ancestor this crop came from
        this.textureCacheTemp.put(key, texture);
        return texture;
    }

    _resolve(norder, pix, path) {
        if (norder < 0) return null;
        const key = this.getKey(norder, pix);
        if (this.has(norder, pix)) {
            if (this.textureCacheMain.has(key)) {
                return { texture: this.textureCacheMain.get(key), path, sourceKey: key };
            }
            this.load(norder, pix);
        }
        if (norder === 0) return null;
        path.push(pix % 4);
        return this._resolve(norder - 1, Math.floor(pix / 4), path);
    }

    _crop(texture, path) {
        if (path.length === 0) return texture;
        let min_u = 0, max_u = 1, min_v = 0, max_v = 1;
        for (let i = path.length - 1; i >= 0; i--) {
            const delta_u = (max_u - min_u) / 2;
            const delta_v = (max_v - min_v) / 2;
            switch (path[i]) {
                case 0: max_u -= delta_u; min_v += delta_v; break;
                case 1: max_u -= delta_u; max_v -= delta_v; break;
                case 2: min_u += delta_u; min_v += delta_v; break;
                case 3: min_u += delta_u; max_v -= delta_v; break;
            }
        }
        const t = texture.clone();
        t.repeat.set(max_u - min_u, max_v - min_v);
        t.offset.set(min_u, min_v);
        return t;
    }
}

// 1x1 transparent placeholder so the sampler uniform is never null
const EMPTY_USER_TEX = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
EMPTY_USER_TEX.needsUpdate = true;

export class MeshLoader {
    constructor(group) {
        this.textureLoader = new TextureLoader();
        this.meshCache = new LRUCache(100);
        this.group = group;
        // SPIKE APO-80
        this.userLoader = null;
        this.userOpacity = 1.0;
        window.__spikeMeshLoader = this;
        this.meshCache.onEvict = (key, mesh) => {
            this.group.remove(mesh);

            mesh.geometry && mesh.geometry.dispose();
            if (mesh.material) {
                Array.isArray(mesh.material)
                    ? mesh.material.forEach(mat => mat.dispose())
                    : mesh.material.dispose();
            }
        };

        // Подписываемся на изменения настроек debug
        window.addEventListener('debug-settings-changed', (event) => {
            if (event.detail.showTileBounds !== undefined) {
                this.updateAllMeshWireframes(event.detail.showTileBounds);
            }
        });
    }

    /**
     * Обновляет отображение границ для всех существующих мешей
     * @param {boolean} showBounds - показывать границы или нет
     */
    updateAllMeshWireframes(showBounds) {
        for (const [key, mesh] of this.meshCache) {
            if (showBounds) {
                // Добавляем границы если их еще нет
                if (!mesh.userData.boundsLines) {
                    const [norder, pix] = key.split('/').map(Number);
                    const boundsGeometry = createTileBoundsGeometry(norder, pix);
                    const boundsMaterial = new THREE.LineBasicMaterial({ 
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.8,
                        depthTest: false
                    });
                    const boundsLines = new THREE.LineLoop(boundsGeometry, boundsMaterial);
                    mesh.add(boundsLines);
                    mesh.userData.boundsLines = boundsLines;
                }
            } else {
                // Удаляем границы если они есть
                if (mesh.userData.boundsLines) {
                    mesh.remove(mesh.userData.boundsLines);
                    mesh.userData.boundsLines.geometry.dispose();
                    mesh.userData.boundsLines.material.dispose();
                    delete mesh.userData.boundsLines;
                }
            }
        }
    }

    loadTile(norder, pix) {
        const key = this.getKey(norder, pix);

        if (this.meshCache.has(key)) {
            return;
        }

        this.createMeshWithTexture(norder, pix);
    }

    // SPIKE APO-80
    setUserLayer(loader) {
        this.userLoader = loader;
    }

    _applyUserTexture(mesh, order, pix) {
        const u = mesh.material.uniforms;
        const tex = this.userLoader ? this.userLoader.getTexture(order, pix) : null;
        if (!tex) {
            u.hasUser.value = 0.0;
            return;
        }
        u.userMap.value = tex;
        u.userOffset.value.set(tex.offset.x, tex.offset.y);
        u.userRepeat.value.set(tex.repeat.x, tex.repeat.y);
        u.userOpacity.value = this.userOpacity;
        u.hasUser.value = 1.0;
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

            const currentTex = mesh?.material?.uniforms?.map?.value;
            if (currentTex && !currentTex.userData) {
                const texture = this.textureLoader.getTexture(order, pix);
                if (texture.userData) {
                    mesh.material.uniforms.map.value = texture;
                    mesh.material.uniforms.mapOffset.value.set(texture.offset.x, texture.offset.y);
                    mesh.material.uniforms.mapRepeat.value.set(texture.repeat.x, texture.repeat.y);
                }
            }
            // SPIKE APO-80: refresh the user layer until the real tile arrives
            if (mesh && this.userLoader && !(mesh.material.uniforms.userMap.value.userData === true)) {
                this._applyUserTexture(mesh, order, pix);
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
        const material = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                mapOffset: { value: new THREE.Vector2(texture.offset.x, texture.offset.y) },
                mapRepeat: { value: new THREE.Vector2(texture.repeat.x, texture.repeat.y) },
                // SPIKE APO-80
                userMap: { value: EMPTY_USER_TEX },
                userOffset: { value: new THREE.Vector2(0, 0) },
                userRepeat: { value: new THREE.Vector2(1, 1) },
                userOpacity: { value: this.userOpacity },
                hasUser: { value: 0.0 },
            },
            vertexShader: dssTileVertex,
            fragmentShader: dssTileFragment,
            side: THREE.DoubleSide,
            depthTest: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        this._applyUserTexture(mesh, norder, pix); // SPIKE APO-80

        // Создаем границы тайла если флаг включен
        if (debugSettings.get('showTileBounds')) {
            const boundsGeometry = createTileBoundsGeometry(norder, pix);
            const boundsMaterial = new THREE.LineBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                depthTest: false
            });
            const boundsLines = new THREE.LineLoop(boundsGeometry, boundsMaterial);
            mesh.add(boundsLines);
            mesh.userData.boundsLines = boundsLines;
        }

        this.group.add(mesh);
        this.meshCache.put(this.getKey(norder, pix), mesh);
    }


    getKey(norder, pix) {
        return `${norder}/${pix}`;
    }
}
