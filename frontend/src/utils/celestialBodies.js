import * as THREE from 'three';
import ShaderLoader from './shaderLoader';
import { CelestialRadii } from './AstronomyHelper';
import { calculateSizePx } from './algos';
import { randFloat } from 'three/src/math/MathUtils';
import { createStarMaterial } from './starShader';


function loadShaderSync(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); // false – синхронный запрос
    xhr.send(null);
    if (xhr.status === 200) {
        return xhr.responseText;
    } else {
        throw new Error(`Ошибка загрузки шейдера: ${url}`);
    }
}

export class CelestialBodyNew {
    constructor(scene, camera, texturePath, vertexShaderPath, fragmentShaderPath, radius, minSizePx, glowColor = [1, 1, 1]) {
        this.scene = scene;
        this.camera = camera;
        this.radiusKm = radius;
        this.deltaRotation = 0;
        this.distanceKm = 0;
        this.sizePx = 0;
        this.minSize = minSizePx;


        this.pointPosition = new THREE.Vector3(0, 0, -10);

        // Создаём квад (два треугольника)
        this.quad = new THREE.BufferGeometry();
        const quadVertices = new Float32Array([
            -1, -1, 0,  // Левый нижний угол
            1, -1, 0,  // Правый нижний угол
            1, 1, 0,  // Правый верхний угол
            -1, 1, 0   // Левый верхний угол
        ]);
        const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        this.quad.setAttribute('position', new THREE.BufferAttribute(quadVertices, 3));
        this.quad.setIndex(new THREE.BufferAttribute(quadIndices, 1));

        const texture = new THREE.TextureLoader().load(texturePath);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const vertexShader = loadShaderSync('shaders/vertexNew.glsl');
        const fragmentShader = loadShaderSync('shaders/fragmentNew.glsl');

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uNorth: { value: new THREE.Vector3(1, 0, 0) },
                uSpin: { value: 0.0 },
                uDirection: { value: new THREE.Vector3(1, 1, 0) },
                uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
                uDistance: { value: 3800 },
                uSunDistance: { value: 1 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });


        this.ra = 0;
        this.dec = 0;


        // Создаём меш
        this.mesh = new THREE.Mesh(this.quad, this.material);

        // Сброс глубины перед отрисовкой этого объекта

        this.scene.add(this.mesh);


        // --- Создание glow-эффекта ---
        // Используем созданную функцию createGlowMaterial для получения шейдерного материала glow
        this.glowMaterial = createStarMaterial();
        // Создаём геометрию для glow – одна точка в центре с необходимыми атрибутами
        this.glowGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array([0, 0, 0]);
        const vmagArray = new Float32Array([-1.0]); // значение по умолчанию для vmag
        const colorArray = new Float32Array(glowColor); // белый цвет
        this.glowGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        this.glowGeometry.setAttribute("vmag", new THREE.BufferAttribute(vmagArray, 1));
        this.glowGeometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
        // Создаём объект glow с использованием Points и добавляем его в сцену
        this.glow = new THREE.Points(this.glowGeometry, this.glowMaterial);
        this.scene.add(this.glow);
    }

    setMag(mag) {
        this.glow.material.uniforms.planetVmag.value = mag;
        //this.glow.material.uniforms.
    }

    setSize() {
        //const sizePx = calculateSizePx(this.camera.fov, window.innerHeight, this.radius, this.distance);
        //sizePx = Math.max(20, sizePx) * window.devicePixelRatio;
        // Исходно квадрат имеет размеры 2 x 2, масштабируем до нужного размера.


    }

    getPosition() {
        return this.mesh.position;
    }

    setDistance(distanceKm) {
        this.distanceKm = distanceKm;
        this.sizePx = this.radiusKm / this.distanceKm * 10 * 2;

        this.material.uniforms.uDistance.value = distanceKm / (100000000);
    }

    updateTexturePosition() {
        this.mesh.lookAt(this.camera.position);
    }

    updateSize() {
        let sizePx = Math.max(this.minSize * this.camera.fov / 120, this.sizePx);
        this.mesh.scale.set(sizePx / 2, sizePx / 2, 1);
        this.mesh.scale.set(sizePx / 2, sizePx / 2, 1);
        this.glow.material.uniforms.fov.value = this.camera.fov;
    }

    setNorth(x, y, z) {
        this.material.uniforms.uNorth.value.set(
            x, y, z
        );
    }

    setSpin(spin) {
        this.material.uniforms.uSpin.value = spin + this.deltaRotation;
    }

    setSunDir(sunDir, sunDistance) {
        this.material.uniforms.uSunDirection.value.set(sunDir.x, sunDir.y, sunDir.z);
        this.material.uniforms.uSunDistance.value = sunDistance / (100000000);
    }

    setPosition(x, y, z) {
        this.material.uniforms.uDirection.value.set(x, y, z);
        this.mesh.position.set(x, y, z);
        this.pointPosition.set(x, y, z);
        this.glow.position.copy(this.mesh.position);

        this.mesh.lookAt(this.camera.position);
    }

    setCelestialPosition(ra, dec) {
        this.ra = ra;
        this.dec = dec;
    }
}

export default CelestialBodyNew;


class MoonNew extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_moon-min.jpg', 'shaders/vertexNew.glsl', 'shaders/fragmentNew.glsl', CelestialRadii.Moon, 0.8);
        this.name = 'Moon';
        this.deltaRotation = 1.5 * Math.PI;
    }
}


class Mars extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_mars-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Mars, 0, [0.8, 0.4, 0.3]);
        this.name = 'Mars';
        this.deltaRotation = 1.77 * Math.PI;
    }
}

class Jupiter extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '8k_jupiter-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Jupiter, 0, [0.9, 0.88, 0.68]);
        this.name = 'Jupiter';
        this.deltaRotation = 0.5 * Math.PI;
    }
}

class Uranus extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_uranus-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Uranus, 0, [0.6, 0.8, 0.9]);
        this.name = 'Uranus';
    }
}

class Neptune extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_neptune-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Neptune, 0, [0.3, 0.5, 0.8]);
        this.name = 'Neptune';
    }
}

class Saturn extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_saturn-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Saturn, 0, [0.9, 0.8, 0.6]);
        this.name = 'Saturn';
    }
}

class Venus extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_venus_atmosphere-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Venus, 0);
        this.name = 'Venus';
    }
}

class Mercury extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_mercury-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Mercury, 0);
        this.name = 'Mercury';
    }
}

class Sun extends CelestialBodyNew {
    constructor(scene, camera) {
        super(scene, camera, '2k_sun-min.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Sun, 0.8, [1.0, 1.0, 0.8]);
        this.name = 'Sun';
    }
}

export { Mars, Jupiter, Uranus, Neptune, Saturn, Venus, Mercury, Sun, MoonNew };