import * as THREE from 'three';

/**
 * GraphicsDebugManager для визуализации векторов и отладочной графики
 */
export default class GraphicsDebugManager {
    constructor(scene) {
        this.scene = scene;
        
        // Группа для всех отладочных объектов
        this.debugGroup = new THREE.Group();
        this.debugGroup.name = 'DebugGraphics';
        
        // Массив для хранения созданных векторов (для очистки)
        this.vectors = [];
        
        if (scene) {
            scene.add(this.debugGroup);
        }
    }

    /**
     * Рисует вектор между двумя точками
     * @param {THREE.Vector3} startPoint - Начальная точка
     * @param {THREE.Vector3} endPoint - Конечная точка  
     * @param {number} color - Цвет в формате hex (например, 0xff0000 для красного)
     * @param {number} thickness - Толщина линии (по умолчанию 2)
     * @param {string} name - Имя вектора для идентификации (опционально)
     */
    drawVector(startPoint, endPoint, color = 0xff0000, thickness = 2, name = '') {
        // Создаем геометрию для линии
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            startPoint.x, startPoint.y, startPoint.z,
            endPoint.x, endPoint.y, endPoint.z
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Создаем материал для линии
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            linewidth: thickness // Note: linewidth может не работать на всех устройствах
        });

        // Создаем линию
        const line = new THREE.Line(geometry, material);
        if (name) {
            line.name = name;
        }

        // Создаем стрелку на конце вектора
        const direction = endPoint.clone().sub(startPoint).normalize();
        const length = startPoint.distanceTo(endPoint);
        
        // Размер стрелки пропорционален длине вектора
        const arrowSize = Math.min(0.1, length * 0.1);
        
        // Создаем конус для стрелки
        const arrowGeometry = new THREE.ConeGeometry(arrowSize * 0.3, arrowSize, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: color });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        
        // Позиционируем стрелку на конце вектора
        arrow.position.copy(endPoint);
        arrow.lookAt(endPoint.clone().add(direction));

        // Группируем линию и стрелку
        const vectorGroup = new THREE.Group();
        vectorGroup.add(line);
        vectorGroup.add(arrow);
        vectorGroup.name = `Vector_${name || this.vectors.length}`;

        // Добавляем в отладочную группу
        this.debugGroup.add(vectorGroup);
        this.vectors.push(vectorGroup);

        return vectorGroup;
    }

    /**
     * Рисует вектор от точки в направлении
     * @param {THREE.Vector3} origin - Начальная точка
     * @param {THREE.Vector3} direction - Направление (будет нормализовано)
     * @param {number} length - Длина вектора
     * @param {number} color - Цвет
     * @param {number} thickness - Толщина
     * @param {string} name - Имя вектора
     */
    drawVectorFromDirection(origin, direction, length = 1, color = 0xff0000, thickness = 2, name = '') {
        const endPoint = origin.clone().add(direction.clone().normalize().multiplyScalar(length));
        return this.drawVector(origin, endPoint, color, thickness, name);
    }

    /**
     * Очищает все отладочные векторы
     */
    clearVectors() {
        for (const vector of this.vectors) {
            this.debugGroup.remove(vector);
            // Освобождаем ресурсы
            vector.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        this.vectors = [];
    }

    /**
     * Удаляет конкретный вектор по имени
     * @param {string} name - Имя вектора для удаления
     */
    removeVector(name) {
        const vectorIndex = this.vectors.findIndex(v => v.name === `Vector_${name}`);
        if (vectorIndex !== -1) {
            const vector = this.vectors[vectorIndex];
            this.debugGroup.remove(vector);
            vector.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.vectors.splice(vectorIndex, 1);
        }
    }

    /**
     * Показать/скрыть все отладочные объекты
     * @param {boolean} visible - Видимость
     */
    setVisible(visible) {
        this.debugGroup.visible = visible;
    }

    /**
     * Освобождение ресурсов
     */
    dispose() {
        this.clearVectors();
        if (this.scene && this.debugGroup) {
            this.scene.remove(this.debugGroup);
        }
    }
}
