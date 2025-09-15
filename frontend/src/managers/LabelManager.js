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