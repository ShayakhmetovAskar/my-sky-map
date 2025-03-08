import * as THREE from 'three';
import { LRUCache } from './LRUCache';

const textureLoader = new THREE.TextureLoader();
const textureCache = new LRUCache(500);

class TileLoader {
    constructor(maxConcurrent = 5) {
        this.maxConcurrent = maxConcurrent; // Максимум параллельных загрузок
        this.currentCount = 0;             // Текущее число активных загрузок
    }

    /**
     * Метод для загрузки текстуры для tile (с учётом concurrency).
     * @param {HealpixTile} tile — тайл, который надо загрузить
     * @param {THREE.PlaneGeometry} geometry — геометрия (если нужно передать)
     * @returns {Promise<THREE.Mesh>} Промис, который резолвится мешем или ошибкой.
     */
    load(tile, geometry) {
        if (tile.loadingPromise) {
            return tile.loadingPromise;
        }

        // Если текстура уже есть в кэше, используем её
        const cachedTexture = textureCache.get(tile.url);
        if (cachedTexture) {
            const material = new THREE.MeshBasicMaterial({
                map: cachedTexture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.4,
            });
            tile.mesh = new THREE.Mesh(geometry, material);
            tile.loadingPromise = Promise.resolve(tile.mesh);
            return tile.loadingPromise;
        }

        if (this.currentCount >= this.maxConcurrent) {
            return null;
        }

        tile.loadingPromise = new Promise((resolve, reject) => {
            const task = { tile, geometry, resolve, reject };
            this.currentCount++;
            this._doLoad(task);
        });

        return tile.loadingPromise;
    }

    /**
     * Непосредственная загрузка текстуры для заданного тайла.
     */
    _doLoad({ tile, geometry, resolve, reject }) {
        textureLoader.load(
            tile.url,
            (texture) => {
                // Сохраняем загруженную текстуру в кэш
                textureCache.put(tile.url, texture);
                // Создаём материал и меш с использованием загруженной текстуры
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.4,
                });
                tile.mesh = new THREE.Mesh(geometry, material);

                resolve(tile.mesh);
                this._onLoadComplete();
            },
            undefined, // progress
            (error) => {
                reject(error);
                this._onLoadComplete();
            }
        );
    }

    /**
     * Колбэк, вызываемый когда _doLoad() завершился (успешно или с ошибкой).
     */
    _onLoadComplete() {
        this.currentCount--;
    }
}

export const tileLoader = new TileLoader(5);
