import { Mars, Jupiter, Uranus, Neptune, Venus, Saturn, Mercury, Sun, CelestialBodyNew, MoonNew } from '@/utils/celestialBodies.js';
import AstronomyHelper from '@/utils/AstronomyHelper.js';
import { equatorial_to_cartesian } from '@/utils/algos.js';

/**
 * CelestialManager управляет небесными телами:
 * - Хранит экземпляры небесных объектов: Солнце Луна планеты...
 * - Обновляет их координаты на основании даты/времени/наблюдателя
 */
export default class CelestialManager {
    /**
     * @param {THREE.Camera} camera
     * @param {THREE.Group|THREE.Scene} root
     */
    constructor(camera, root) {
        this.root = root;
        this.camera = camera;

        this.sun = new Sun(this.root, this.camera);

        this.bodies = [
            this.sun,
            //new Moon(this.root, this.camera),
            new MoonNew(this.root, this.camera),
            new Mars(this.root, this.camera),
            new Jupiter(this.root, this.camera),
            new Uranus(this.root, this.camera),
            new Neptune(this.root, this.camera),
            new Venus(this.root, this.camera),
            new Saturn(this.root, this.camera),
            new Mercury(this.root, this.camera),
        ]

        this.moon = this.bodies[8];
    }

    /**
     * Обновление позиции и ориентации объектов на небесной сфере
     * @param {Date} date
     * @param {{ latitude: number, longitude: number, height?: number }} observer
     */
    updatePositions(date, observer) {
        for (let i = 0; i < this.bodies.length; i++) {
            const bodyInfo = AstronomyHelper.calculateCelestialBodyInfo(date, observer, this.bodies[i].name);

            this.bodies[i].setDistance(bodyInfo.distanceKm);
            this.bodies[i].setPosition(...bodyInfo.coordinatesCartesian);

            this.bodies[i].setNorth(...bodyInfo.northVector);
            this.bodies[i].setSpin(bodyInfo.spinRad);
            this.bodies[i].setMag(bodyInfo.magnitude);

            this.bodies[i].setCelestialPosition(bodyInfo.raRad, bodyInfo.decRad);
        }

        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].setSunDir(this.sun.pointPosition, this.sun.distanceKm);
        }

        this.bodies.sort((a, b) => b.distanceKm - a.distanceKm);

        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].mesh.renderOrder = i + 10000; // Устанавливаем renderOrder от дальнего к ближнему
        }
    }

    /**
    * Обновление позиции на экране перед отрисовкой кадра или изменении fov
    */
    update(up) {
        this.bodies.sort((a, b) => a.distanceKm - b.distanceKm);
        for (let i = 0; i < this.bodies.length; i++) {
            if (up) {
                this.bodies[i].setUp(up);
            }
            this.bodies[i].updateTexturePosition();
            this.bodies[i].updateSize();
        }
    }

    dispose() {
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].removeFromParent();
            this.bodies[i] = null;
        }
    }
}
