import * as THREE from 'three';

export default class OverlayManager {
    constructor(scene, controls) {
        this.scene = scene;
        this.controls = controls;
        this.textureLoader = new THREE.TextureLoader();
        this.overlays = {}; // Объект для хранения мешей по task_id**
    }

    async overlay(task_id) {
        try {
            // 1. Получаем данные задачи
            const response = await fetch(`/api/task/${task_id}`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);


            const taskData = await response.json();

            const result = taskData.result;

            // 2. Создаем геометрию на основе mesh
            const geometry = this.createMeshGeometry(result.mesh);

            // 3. Загружаем текстуру
            const texture = await this.loadTexture(taskData.file_path);

            // 4. Создаем материал и меш
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1,
                depthTest: false,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = -10000;
            this.scene.add(mesh);
            this.overlays[task_id] = mesh; // Сохраняем меш в overlays**
            
            this.focusCameraOnMeshCenter(result.mesh);


            return result;

        } catch (error) {
            console.error('Ошибка в overlay:', error);
        }
    }

    getCenterPosition(meshData) {
        // Получаем количество строк и столбцов
        const rows = meshData.length;
        const cols = meshData[0].length;

        // Находим индексы центрального элемента
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);

        // Получаем координаты центрального элемента
        const { ra, dec } = meshData[centerRow][centerCol];

        // Конвертация градусов в радианы
        const raRad = THREE.MathUtils.degToRad(ra);
        const decRad = THREE.MathUtils.degToRad(dec);

        // Радиус сферы - такой же, как в createMeshGeometry
        const R = 10;

        // Преобразование в 3D координаты (как в оригинальной функции)
        const x = R * -Math.cos(decRad) * Math.sin(raRad);
        const y = R * Math.sin(decRad);
        const z = R * -Math.cos(decRad) * Math.cos(raRad);

        const cornerStart = meshData[0][0];
        const cornerEnd = meshData[rows - 1][cols - 1];

        // Конвертируем угловые координаты в радианы
        const raStartRad = THREE.MathUtils.degToRad(cornerStart.ra);
        const decStartRad = THREE.MathUtils.degToRad(cornerStart.dec);
        const raEndRad = THREE.MathUtils.degToRad(cornerEnd.ra);
        const decEndRad = THREE.MathUtils.degToRad(cornerEnd.dec);

        // Создаем нормализованные векторы направления для обеих точек
        const vecStart = new THREE.Vector3(
            -Math.cos(decStartRad) * Math.sin(raStartRad),
            Math.sin(decStartRad),
            -Math.cos(decStartRad) * Math.cos(raStartRad)
        ).normalize();

        const vecEnd = new THREE.Vector3(
            -Math.cos(decEndRad) * Math.sin(raEndRad),
            Math.sin(decEndRad),
            -Math.cos(decEndRad) * Math.cos(raEndRad)
        ).normalize();

        // Вычисляем угол между векторами в радианах
        const angle = vecStart.angleTo(vecEnd);

        // Возвращаем объект с позицией и углом
        return {
            position: new THREE.Vector3(x, y, z),
            angleRadians: angle
        };
    }

    focusCameraOnMeshCenter(meshData) {
        // Получаем центральную позицию в локальных координатах меша
        const centerPosData = this.getCenterPosition(meshData);
        if (!centerPosData) return;

        const centerPos = centerPosData.position;
        const meshFovRadians = centerPosData.angleRadians; 
        const fovDegrees = Math.max(1, Math.min(THREE.MathUtils.radToDeg(meshFovRadians) * 3, 100));


        // Создаем вектор для хранения мировых координат
        const worldPos = centerPos.clone();

        // Применяем матрицу трансформации сцены к позиции
        // Это учитывает все повороты и смещения сцены
        worldPos.applyMatrix4(this.scene.matrixWorld);
        worldPos.normalize()
        // Направляем камеру в эту точку
        this.controls.camera.position.set(-worldPos.x, -worldPos.y, -worldPos.z);
        this.controls.setFov(fovDegrees);
        console.log(worldPos);

        return worldPos;
    }

    setOverlaysOpacity(opacity) {
        for (const task_id in this.overlays) {
            const mesh = this.overlays[task_id];
            if (mesh && mesh.material) {
                mesh.material.opacity = opacity;
            }
        }
    }

    removeAllOverlays() {
        for (const task_id in this.overlays) {
            const mesh = this.overlays[task_id];
            if (mesh) {
                // Удаляем меш из сцены
                this.scene.remove(mesh);

                // Освобождаем ресурсы
                mesh.geometry.dispose(); // Удаляем геометрию
                if (mesh.material.map) {
                    mesh.material.map.dispose(); // Удаляем текстуру
                }
                mesh.material.dispose(); // Удаляем материал
            }
        }

        // Очищаем объект overlays
        this.overlays = {};
    }

    removeOverlay(task_id) {
        const mesh = this.overlays[task_id];
        if (mesh) {
            // Удаляем меш из сцены
            this.scene.remove(mesh);

            // Освобождаем ресурсы
            mesh.geometry.dispose(); // Удаляем геометрию
            if (mesh.material.map) {
                mesh.material.map.dispose(); // Удаляем текстуру
            }
            mesh.material.dispose(); // Удаляем материал

            // Удаляем запись из overlays
            delete this.overlays[task_id];
        } else {
            console.warn(`Overlay для task_id ${task_id} не найден.`);
        }
    }

    createMeshGeometry(meshData) {
        const rows = meshData.length;
        const cols = meshData[0].length;
        const geometry = new THREE.PlaneGeometry(1, 1, cols - 1, rows - 1);

        // Преобразуем сферические координаты в декартовы
        const posAttr = geometry.attributes.position;
        const R = 10; // Радиус сферы

        for (let i = 0; i < posAttr.count; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const { ra, dec } = meshData[row][col];

            // Конвертация градусов в радианы
            const raRad = THREE.MathUtils.degToRad(ra);
            const decRad = THREE.MathUtils.degToRad(dec);

            // Преобразование в 3D координаты
            const x = R * -Math.cos(decRad) * Math.sin(raRad);
            const y = R * Math.sin(decRad);
            const z = R * -Math.cos(decRad) * Math.cos(raRad);

            posAttr.setXYZ(i, x, y, z);
        }

        posAttr.needsUpdate = true;
        geometry.computeVertexNormals();
        return geometry;
    }

    async loadTexture(file_path) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                `/api/uploads/${file_path}`,
                texture => {
                    // Улучшенные настройки текстуры
                    texture.colorSpace = THREE.SRGBColorSpace; // Правильное цветовое пространство
                    texture.minFilter = THREE.LinearMipmapLinearFilter; // Сглаживание при уменьшении
                    texture.magFilter = THREE.LinearFilter; // Сглаживание при увеличении
                    texture.wrapS = THREE.ClampToEdgeWrapping; // Предотвращаем повторение
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.generateMipmaps = true; // Генерируем мипмапы для лучшего качества
                    //texture.flipY = false; // Отключаем переворот по Y, если нужно

                    // Принудительно обновляем текстуру
                    texture.needsUpdate = true;

                    resolve(texture);
                },
                undefined,
                err => reject(err)
            );
        });
    }
}