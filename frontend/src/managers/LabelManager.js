import * as THREE from 'three';
import { LRUCache } from '@/utils/LRUCache';

/**
 * LabelManager отвечает за создание и управление текстовыми подписями звезд
 */
export default class LabelManager {
    constructor(scene) {
        // Кэш названий звезд (source_id -> name)
        this.nameCache = new LRUCache(500);
        // Множество текущих запросов для предотвращения дублирования
        this.pendingLookups = new Set();
        
        // Создаем группу для лейблов и добавляем в сцену
        this.labelsGroup = new THREE.Group();
        this.labelsGroup.name = 'StarLabels';
        if (scene) {
            scene.add(this.labelsGroup);
        }
    }

    /**
     * Создает текстовый спрайт из строки
     * @param {string} text - Текст для отображения
     * @param {string} color - Цвет текста (по умолчанию 'white')
     * @param {number} fontSize - Размер шрифта (по умолчанию 6)
     * @param {number} scaleFactor - Фактор масштабирования (по умолчанию 4)
     * @returns {THREE.Sprite} - Созданный спрайт
     */
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
}