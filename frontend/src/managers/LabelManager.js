import * as THREE from 'three';
import { LRUCache } from '@/utils/LRUCache';
import { API_CONFIG } from '../settings/api.js';

/**
 * LabelManager отвечает за создание и управление текстовыми подписями звезд и планет
 */
export default class LabelManager {
    constructor(scene, sceneManager = null) {
        // Кэш названий звезд (source_id -> name)
        this.nameCache = new LRUCache(500);
        // Множество текущих запросов для предотвращения дублирования
        this.pendingLookups = new Set();
        
        // Ссылка на SceneManager для получения camera up
        this.sceneManager = sceneManager;
        
        // Создаем группу для лейблов и добавляем в сцену
        this.labelsGroup = new THREE.Group();
        this.labelsGroup.name = 'StarLabels';
        
        // Создаем отдельную группу для лейблов планет
        this.planetLabelsGroup = new THREE.Group();
        this.planetLabelsGroup.name = 'PlanetLabels';
        
        // Создаем лейблы планет сразу
        this.planetLabels = {};
        this.createPlanetLabels();
        
        if (scene) {
            scene.add(this.labelsGroup);
            scene.add(this.planetLabelsGroup);
        }
    }

    /**
     * Создает текстовый спрайт из строки (минималистичный стиль)
     * @param {string} text - Текст для отображения
     * @param {string} color - Цвет текста (по умолчанию 'white')
     * @param {number} fontSize - Размер шрифта (по умолчанию 5)
     * @param {number} scaleFactor - Фактор масштабирования (по умолчанию 3)
     * @returns {THREE.Sprite} - Созданный спрайт
     */
    createTextSprite(text, color = 'rgba(255, 255, 255, 0.9)', fontSize = 5, scaleFactor = 3) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const largeFontSize = fontSize * scaleFactor;
        context.font = `300 ${largeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        
        const textWidth = context.measureText(text).width;
        const padding = 4 * scaleFactor; // Минимальные отступы
        
        canvas.width = textWidth + padding;
        canvas.height = largeFontSize + padding;
        
        // Чистый минималистичный текст с тонким шрифтом
        context.font = `200 ${largeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        context.fillStyle = color;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(text, padding / 2, padding / 2);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            depthTest: false 
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        const spriteScale = 1 / scaleFactor;
        sprite.scale.set(
            (textWidth + padding) / 10 * spriteScale, 
            (largeFontSize + padding) / 10 * spriteScale, 
            1
        );

        return sprite;
    }

    /**
     * Получает название звезды из кэша или запрашивает с сервера
     * @param {string} source_id - Идентификатор звезды
     * @returns {Promise<string|null>} - Название звезды или null
     */
    async fetchAndCacheStarName(source_id) {
        if (this.nameCache.has(source_id) || this.pendingLookups.has(source_id)) return;

        if (this.pendingLookups.size > 5) {
            return;
        }

        this.pendingLookups.add(source_id);
        try {
            const res = await fetch(`${API_CONFIG.STAR_NAMES.baseUrl}/${source_id}`);
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

    /**
     * Получает название звезды из кэша
     * @param {string} source_id - Идентификатор звезды
     * @returns {string|null|undefined} - Название звезды, null если не найдено, undefined если еще не запрашивалось
     */
    getStarName(source_id) {
        return this.nameCache.get(source_id);
    }

    /**
     * Очищает все лейблы
     */
    clearLabels() {
        this.labelsGroup.clear();
    }

    /**
     * Добавляет спрайт в группу лейблов
     * @param {THREE.Sprite} sprite - Спрайт для добавления
     */
    addLabel(sprite) {
        this.labelsGroup.add(sprite);
    }

    /**
     * Получает группу лейблов (для совместимости)
     * @returns {THREE.Group} - Группа лейблов
     */
    getLabelsGroup() {
        return this.labelsGroup;
    }


    /**
     * Создает все лейблы планет сразу
     */
    createPlanetLabels() {
        const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
        
        for (const planetName of planetNames) {
            const displayName = planetName;
            const sprite = this.createTextSprite(displayName, 'rgba(255, 255, 255, 0.9)', 5, 3);
            sprite.visible = false; // Изначально скрыты
            
            this.planetLabels[planetName] = sprite;
            this.planetLabelsGroup.add(sprite);
        }
    }

    /**
     * Обновляет позицию лейбла планеты
     * @param {string} planetName - Название планеты
     * @param {THREE.Vector3} position - Позиция планеты в 3D пространстве
     * @param {THREE.Camera} camera - Камера для расчета масштаба
     * @param {number} planetSizePx - Размер планеты в пикселях для смещения лейбла
     */
    updatePlanetLabel(planetName, position, camera, planetSizePx = 0) {
        const sprite = this.planetLabels[planetName];
        if (!sprite || !this.sceneManager) return;

        // Создаем локальную систему координат
        // 1. Forward: от камеры к объекту
        const forward = position.clone().sub(camera.position).normalize();
        
        // 2. Up: направление "вверх" относительно камеры
        const up = this.sceneManager.getCameraUp();
        
        // 3. Right: векторное произведение forward × up
        const right = forward.clone().cross(up).normalize();
        
        
        // Смещение влево на 0.6 * planetSizePx
        //const offset = right.multiplyScalar(0.6 * planetSizePx * 1); // 0.01 для корректного масштаба в 3D
        const offset = up.multiplyScalar(0.6 * planetSizePx * 1); // 0.01 для корректного масштаба в 3D
        // Позиционируем лейбл со смещением влево
        sprite.position.copy(position).add(offset);
        sprite.center.set(0.5, 0);

        // Применяем масштабирование в зависимости от FOV камеры
        const scalingFactor = camera.fov / 120;
        if (!sprite.userData.baseScale) {
            sprite.userData.baseScale = sprite.scale.clone();
        }
        sprite.scale.copy(sprite.userData.baseScale);
        sprite.scale.multiplyScalar(scalingFactor);

        sprite.visible = true;
    }

    /**
     * Обновляет все лейблы планет
     * @param {Array} celestialBodies - Массив небесных тел
     * @param {THREE.Camera} camera - Камера
     */
    updateAllPlanetLabels(celestialBodies, camera) {
        for (const body of celestialBodies) {
            if (body.name && body.pointPosition) {
                this.updatePlanetLabel(body.name, body.pointPosition, camera, body.sizePx || 0);
            }
        }
    }
}