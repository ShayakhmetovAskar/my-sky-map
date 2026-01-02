import * as THREE from 'three';
import { LRUCache } from '@/utils/LRUCache';
import { API_CONFIG } from '../settings/api.js';

/**
 * LabelManager отвечает за создание и управление текстовыми подписями звезд и планет
 */
export default class LabelManager {
    constructor(scene, sceneManager = null, options = {}) {
        // Кэш названий звезд (source_id -> name)
        this.nameCache = new LRUCache(500);
        
        // Кэш спрайтов звезд с освобождением ресурсов при вытеснении
        this.starSpriteCache = new LRUCache(50, (key, sprite) => {
            // Освобождаем ресурсы THREE.js при удалении из кэша
            if (sprite.material?.map) {
                sprite.material.map.dispose();
            }
            if (sprite.material) {
                sprite.material.dispose();
            }
            if (sprite.geometry) {
                sprite.geometry.dispose();
            }
        });
        
        // Множество текущих запросов для предотвращения дублирования
        this.pendingLookups = new Set();
        
        // Ссылка на SceneManager для получения camera up
        this.sceneManager = sceneManager;
   
        this.fontFamily = options.fontFamily || `'Courier New', 'Courier', monospace`;
        this.fontWeight = options.fontWeight || '100';
        
        this.fontSize = options.fontSize || 4;
        
        this.scaleFactor = options.scaleFactor || 3;
        
        this.dpiScale = options.dpiScale || 2;
        
        this.defaultColor = options.defaultColor || 'rgba(255, 255, 255, 0.9)';
        
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
     * @param {string} color - Цвет текста (использует this.defaultColor если не указан)
     * @param {number} fontSize - Размер шрифта (использует this.fontSize если не указан)
     * @param {number} scaleFactor - Фактор масштабирования (использует this.scaleFactor если не указан)
     * @returns {THREE.Sprite} - Созданный спрайт
     */
    createTextSprite(text, color = null, fontSize = null, scaleFactor = null) {
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Используем настройки из конструктора, если параметры не переданы
        const actualColor = color || this.defaultColor;
        const actualFontSize = fontSize || this.fontSize;
        const actualScaleFactor = scaleFactor || this.scaleFactor;
        const dpiScale = this.dpiScale;
        
        const largeFontSize = actualFontSize * actualScaleFactor * dpiScale;
        context.font = `${this.fontWeight} ${largeFontSize}px ${this.fontFamily}`;
        
        const textWidth = context.measureText(text).width;
        const padding = 4 * actualScaleFactor * dpiScale; // Минимальные отступы
        
        canvas.width = textWidth + padding;
        canvas.height = largeFontSize + padding;
        
        // Чистый минималистичный текст
        context.font = `${this.fontWeight} ${largeFontSize}px ${this.fontFamily}`;
        context.fillStyle = actualColor;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(text, padding / 2, padding / 2);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthTest: false,
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        // Компенсируем увеличение разрешения canvas уменьшением масштаба спрайта
        const spriteScale = 1 / (actualScaleFactor * dpiScale);
        sprite.scale.set(
            (textWidth + padding) / 10 * spriteScale, 
            (largeFontSize + padding) / 10 * spriteScale, 
            1
        );

        return sprite;
    }

    /**
     * Очищает лишние пробелы в названии звезды (2 и более пробелов заменяются на 1)
     * @param {string} name - Исходное название звезды
     * @returns {string} - Очищенное название
     */
    cleanStarName(name) {
        if (typeof name !== 'string') return name;
        
        // Заменяем 2 и более пробелов подряд на один пробел
        return name.replace(/\s{2,}/g, ' ');
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
                // Очищаем лишние пробелы перед сохранением в кэш
                const cleanedName = this.cleanStarName(data.ProperName);
                this.nameCache.put(source_id, cleanedName);
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
            // Используем настройки по умолчанию из конструктора
            const sprite = this.createTextSprite(displayName);
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
        const cameraUp = this.sceneManager.getCameraUp();
        
        // 3. Right: правое направление (кросс-произведение forward × cameraUp)
        const right = new THREE.Vector3().crossVectors(forward, cameraUp).normalize();
        
        // 4. Локальный up: вверх относительно взгляда на объект (кросс-произведение right × forward)
        const localUp = new THREE.Vector3().crossVectors(right, forward).normalize();
        
        // Смещаем лейбл вверх относительно направления взгляда камеры
        const offset = localUp.multiplyScalar(0.6 * planetSizePx * 1);
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

    /**
     * Умное обновление лейблов звезд с переиспользованием спрайтов
     * @param {Array} starsToShow - Массив звезд для отображения
     * @param {THREE.Camera} camera - Камера для расчета масштаба
     */
    updateStarLabels(starsToShow, camera) {
        const requiredLabels = new Set();
        const labelsToAdd = [];
        const scalingFactor = camera.fov / 120;
        
        // 1. Проходим по звездам и определяем какие лейблы нужны
        for (const star of starsToShow) {
            // Получаем имя звезды из кэша
            let name = this.getStarName(star.source_id);
            
            if (name === undefined) {
                // Имя еще не загружено, запускаем загрузку в фоне и пропускаем
                this.fetchAndCacheStarName(star.source_id);
                continue;
            }
            
            // Если имя null (звезда без названия), используем магнитуду
            const displayText = name || star.phot_g_mean_mag.toFixed(2);
            
            // Пытаемся получить спрайт из кэша
            let sprite = this.starSpriteCache.get(star.source_id);
            
            if (!sprite) {
                // Создаем новый спрайт и добавляем в кэш
                sprite = this.createTextSprite(displayText);
                this.starSpriteCache.put(star.source_id, sprite);
            }
            
            // Обновляем позицию и масштаб спрайта
            if (star.position) {
                sprite.position.copy(new THREE.Vector3(...star.position));
            } else if (star.x !== undefined && star.y !== undefined && star.z !== undefined) {
                sprite.position.set(star.x, star.y, star.z);
            }
            
            sprite.center.set(0, 0.5);
            
            // Сохраняем базовый масштаб при первом использовании
            if (!sprite.userData.baseScale) {
                sprite.userData.baseScale = sprite.scale.clone();
            }
            
            // Применяем масштабирование относительно FOV
            sprite.scale.copy(sprite.userData.baseScale);
            sprite.scale.multiplyScalar(scalingFactor);
            
            // Обновляем userData для обработки кликов
            sprite.userData.name = displayText;
            sprite.userData.source_id = star.source_id;
            sprite.userData.magnitude = star.phot_g_mean_mag;
            
            sprite.visible = true;
            requiredLabels.add(sprite);
            
            // Если спрайта еще нет в группе - помечаем для добавления
            if (!this.labelsGroup.children.includes(sprite)) {
                labelsToAdd.push(sprite);
            }
        }
        
        // 2. Удаляем лейблы, которые больше не нужны
        const toRemove = [];
        for (const child of this.labelsGroup.children) {
            if (!requiredLabels.has(child)) {
                toRemove.push(child);
            }
        }
        
        // Фактическое удаление
        for (const sprite of toRemove) {
            this.labelsGroup.remove(sprite);
        }
        
        // 3. Добавляем новые лейблы
        for (const sprite of labelsToAdd) {
            this.labelsGroup.add(sprite);
        }
    }

    /**
     * Проверяет клик по лейблам
     * @param {MouseEvent} event - Событие клика мыши
     * @param {THREE.Camera} camera - Камера
     * @param {HTMLElement} domElement - DOM элемент canvas
     * @returns {Array} - Массив кликнутых лейблов с информацией
     */
    checkLabelClick(event, camera, domElement) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Конвертируем координаты мыши в нормализованные координаты (-1 to +1)
        const rect = domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Создаем луч от камеры через позицию мыши
        raycaster.setFromCamera(mouse, camera);

        const clickedLabels = [];

        // Проверяем лейблы планет
        for (const planetName in this.planetLabels) {
            const sprite = this.planetLabels[planetName];
            if (sprite.visible) {
                const intersects = raycaster.intersectObject(sprite, false);
                if (intersects.length > 0) {
                    clickedLabels.push({
                        type: 'planet',
                        name: planetName,
                        sprite: sprite,
                        distance: intersects[0].distance
                    });
                }
            }
        }

        // Проверяем лейблы звезд (из labelsGroup)
        const starLabels = this.labelsGroup.children;
        for (let i = 0; i < starLabels.length; i++) {
            const sprite = starLabels[i];
            if (sprite.visible) {
                const intersects = raycaster.intersectObject(sprite, false);
                if (intersects.length > 0) {
                    clickedLabels.push({
                        type: 'star',
                        name: sprite.userData?.name || `star_${i}`,
                        sprite: sprite,
                        distance: intersects[0].distance
                    });
                }
            }
        }

        // Сортируем по расстоянию (ближайшие первыми)
        clickedLabels.sort((a, b) => a.distance - b.distance);

        return clickedLabels;
    }
}
