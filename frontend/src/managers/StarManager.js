import * as THREE from 'three';
import * as StarCache from '/src/utils/starsCache.js';
import {getVisiblePixels, prepareStarsGeometry} from '@/utils/algos.js';
import {createStarMaterial} from '@/utils/starShader.js';

/**
 * StarManager отвечает за:
 *  1) Вычисление видимых HEALPix-пикселей на небе.
 *  2) Запрос данных звёзд с сервера (fetchStarsHeal).
 *  3) Создание и добавление Points (звёзд) в сцену / группу.
 *  4) Кэширование звёзд через StarCache.
 */
export default class StarManager {
    /**
     * @param {THREE.Camera} camera           - Камера от которой вычисляем FOV.
     * @param {THREE.Group|THREE.Scene} root  - Группа в которую добавляем звёзды.
     */
    constructor(camera, root) {
        this.camera = camera;
        this.root = root;

        this.starMaterial = createStarMaterial();

        // Содержит (nside, ipix) для уже отображенных звёзд
        this.visibleHealPixels = new Set();

        this.isLoading = false;
    }

    /**
     * Находит звезды в области видимости камеры и подгружает их
     */
    async updateStars() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            // 1. Берём направление камеры, чтобы понять, куда смотрим
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);

            // 2. Получаем список HEALPix-пикселей, покрывающих поле зрения камеры
            // pixels — массив пар [nside, ipix]
            const pixels = getVisiblePixels(direction.toArray(), this.camera.fov);


            // 3. Для каждого пикселя, которого нет в StarCache, делаем запрос
            const fetchPromises = [];

            for (const [nside, ipix] of pixels) {
                if (!StarCache.hasData(nside, ipix)) {
                    fetchPromises.push(this._loadAndAddStars(nside, ipix));
                }
            }

            await Promise.all(fetchPromises);

        } catch (error) {
            console.error('updateStars error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async updateFOV() {
        this.starMaterial.uniforms.fov.value = this.camera.fov;
    }

    /**
     * Загружает данные звёзд для (nside, ipix), создаёт Points и добавляет в группу.
     * @param {number} nside
     * @param {number} ipix
     */
    async _loadAndAddStars(nside, ipix) {
        try {
            const starsData = await this.fetchStarsHeal(nside, ipix);

            const {positions, vmags, colors} = prepareStarsGeometry(starsData);

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('vmag', new THREE.Float32BufferAttribute(vmags, 1));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const points = new THREE.Points(geometry, this.starMaterial);

            StarCache.addStarList(nside, ipix, points);

            this.root.add(points);
        } catch (err) {
            console.error('Error loading stars for pixel', nside, ipix, err);
        }
    }

    /**
     * Запрос звёзд по (nside, pix).
     */
    async fetchStarsHeal(nside, pix) {
        const params = new URLSearchParams({nside, pix});
        const url = `/api/stars/get?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch star data for nside=${nside}, pix=${pix}`);
        }
        return await response.json();
    }
}
