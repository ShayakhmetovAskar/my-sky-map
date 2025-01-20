import * as THREE from 'three';
import ShaderLoader from './shaderLoader';
import { CelestialRadii } from './AstronomyHelper';
import { calculateSizePx } from './algos';

class CelestialBody {
    constructor(scene, camera, texturePath, vertexShaderPath, fragmentShaderPath, radius, minSizePx) {
        this.scene = scene;
        this.camera = camera;
        this.radius = radius;
        this.distance = -1;
        this.minSizePx = minSizePx;
        this.deltaRotation = 0;

        this.pointPosition = new THREE.Vector3(0, 0, -10);

        const quadGeometry = new THREE.BufferGeometry();
        const quadVertices = new Float32Array([
            -1, -1, 0, // Левый нижний угол
            1, -1, 0,  // Правый нижний угол
            1, 1, 0,   // Правый верхний угол
            -1, 1, 0   // Левый верхний угол
        ]);
        const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

        quadGeometry.setAttribute('position', new THREE.BufferAttribute(quadVertices, 3));
        quadGeometry.setIndex(new THREE.BufferAttribute(quadIndices, 1));

        const texture = new THREE.TextureLoader().load(texturePath);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;


        Promise.all([
            ShaderLoader.loadShader(vertexShaderPath),
            ShaderLoader.loadShader(fragmentShaderPath)
        ]).then(([vertexShader, fragmentShader]) => {

            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    uTexture: { value: texture },
                    uVisible: { value: 1.0 },
                    uCenterPx: { value: new THREE.Vector2(300, 300) },
                    uSizePx: { value: 100 },
                    uNorth: { value: new THREE.Vector3(0, 0, 0) },
                    uSpin: {value: 0.0},
                    uDirection: {value: new THREE.Vector3(1, 0, 0)},
                    uSunDirection: {value: new THREE.Vector3(0, 0, 0)},
                    uDistance: {value: 0.0},
                    uSunDistance: {value: 0.0},
                },
                vertexShader,
                fragmentShader,
                transparent: true,
            });

            this.quad = new THREE.Mesh(quadGeometry, this.material);
            this.scene.add(this.quad);
        });
    }

    updateTexturePosition() {
        if (!this.material) return;
        const vector = this.pointPosition.clone().applyMatrix4(this.camera.matrixWorldInverse);

        if (vector.z > 0) {
            this.material.uniforms.uVisible.value = 0.0;
        } else {
            const screenPosition = this.pointPosition.clone().project(this.camera);
            this.material.uniforms.uCenterPx.value.set(
                (screenPosition.x + 1) / 2 * window.innerWidth * window.devicePixelRatio,
                (screenPosition.y + 1) / 2 * window.innerHeight * window.devicePixelRatio
            );
            this.material.uniforms.uVisible.value = 1.0;
        }
    }

    
    setNorth(x, y, z) {
        if (!this.material) return;
        this.material.uniforms.uNorth.value.set(
            x, y, z
        );
    }

    setSpin(spin) {
        if (!this.material) return; 
        this.material.uniforms.uSpin.value = spin + this.deltaRotation;
    }

    setSunDir(sunDir, sunDistance) {
        if (!this.material) return;
        this.material.uniforms.uSunDirection.value.set(sunDir.x, sunDir.y, sunDir.z);
        this.material.uniforms.uSunDistance.value = sunDistance / (100000000);
    }

    setPosition(x, y, z) {
        if (!this.material) return;
        this.material.uniforms.uDirection.value.set(x, y, z);
        this.pointPosition.set(x, y, z);
        this.updateTexturePosition();
    }

    setDistance(distance) {
        if (!this.material) return;
        this.material.uniforms.uDistance.value = distance / (100000000);
        this.distance = distance;
        this.updateSize();
    }

    updateSize() {
        if (!this.material) return;
        const sizePx = calculateSizePx(this.camera.fov, window.innerHeight, this.radius, this.distance);
        this.material.uniforms.uSizePx.value = Math.max(this.minSizePx, sizePx) * window.devicePixelRatio;
    }
}  


class Moon extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '8k_moon.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Moon, 20);       
        this.name = 'Moon';
        this.deltaRotation = 1.5 * Math.PI;
    }
}

class Mars extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '8k_mars.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Mars, 20);
        this.name = 'Mars';
        this.deltaRotation = 1.77 * Math.PI;
    }
}

class Jupiter extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '8k_jupiter.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Jupiter, 20);
        this.name = 'Jupiter';
        this.deltaRotation = 0.5 * Math.PI;
    }
}

class Uranus extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '2k_uranus.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Uranus, 20);
        this.name = 'Uranus';
    }
}

class Neptune extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '2k_neptune.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Neptune, 20);
        this.name = 'Neptune';
    }
}

class Saturn extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '8k_saturn.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Saturn, 20);
        this.name = 'Saturn';
    }
}

class Venus extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '4k_venus_atmosphere.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Venus, 20);
        this.name = 'Venus';
    }
}

class Mercury extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '8k_mercury.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Mercury, 20);
        this.name = 'Mercury';
    }
}

class Sun extends CelestialBody {
    constructor(scene, camera) {
        super(scene, camera, '2k_sun.jpg', 'shaders/vertex.glsl', 'shaders/fragment.glsl', CelestialRadii.Sun, 20);
        this.name = 'Sun';
    }
}

export { Moon, Mars, Jupiter, Uranus, Neptune, Saturn, Venus, Mercury, Sun };