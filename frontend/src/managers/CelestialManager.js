import { Moon, Mars, Jupiter, Uranus, Neptune, Venus, Saturn, Mercury, Sun} from '@/utils/celestialBodies.js';
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

        this.bodies = [
            new Sun(this.root, this.camera),
            new Moon(this.root, this.camera),
            new Mars(this.root, this.camera),
            new Jupiter(this.root, this.camera),
            new Uranus(this.root, this.camera),
            new Neptune(this.root, this.camera),
            new Venus(this.root, this.camera),
            new Saturn(this.root, this.camera),
            new Mercury(this.root, this.camera),
        ]
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
        }

        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].setSunDir(this.bodies[0].pointPosition, this.bodies[0].distance);
        }
        
    }

    /**
    * Обновление позиции на экране перед отрисовкой кадра или изменении fov
    */
    update() {
        for (let i = 0; i < this.bodies.length; i++) {
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
