import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export default class ControlsManager {
  /**
   * @param {THREE.Camera} camera - Камера Three.js
   * @param {HTMLCanvasElement} domElement - Canvas, к которому прикрепляются OrbitControls
   */
  constructor(camera, domElement) {
    this.camera = camera;

    this.domElement = domElement;

    this.target = null;

    this.fovMin = 0.01;
    this.fovMax = 120;

    this.currentFov = camera.fov;
    this.onFovChanged = null // Коллбек при изменении fov вешается в родителе
    this.controls = new OrbitControls(this.camera, this.domElement);

    this.controls.enableDamping = false;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = -1;
    this.controls.enableZoom = false;
    this.controls.touches.TWO = OrbitControls.TOUCH_NONE;

    this.controls.minDistance = 7;
    this.controls.maxDistance = 7;

    this.isPinching = false;
    this.previousPinchDistance = 0;

    

    this._bindEvents();
  }

  /**
   * Регистрируем события wheel и touch на нашем domElement
   */
  _bindEvents() {
    // Wheel
    this.onWheel = this.onWheel.bind(this);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });

    // Touch
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    this.domElement.addEventListener('touchstart', this.onTouchStart, {
      passive: false
    });
    this.domElement.addEventListener('touchmove', this.onTouchMove, {
      passive: false
    });
    this.domElement.addEventListener('touchend', this.onTouchEnd, false);
    this.domElement.addEventListener('touchcancel', this.onTouchEnd, false);
  }


  _onFovChange(newFov) {
    newFov = THREE.MathUtils.clamp(newFov, this.fovMin, this.fovMax);
    this.currentFov = newFov

    this.camera.fov = newFov;
    this.camera.updateProjectionMatrix();

    this.controls.rotateSpeed = (-1) * this.camera.fov / 200;

    this.controls.minDistance = this._mapFovToDistance(newFov);
    this.controls.maxDistance = this._mapFovToDistance(newFov);

    if (this.onFovChanged) {
      this.onFovChanged(newFov);
    }
  }

  setFov(newFov) {
    this._onFovChange(newFov);
  }


  onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY * 0.05 * (this.currentFov / 60);
    let newFov = this.currentFov + delta;
    this._onFovChange(newFov);
  }

  /**
   * Начало тач-жеста (pinch)
   */
  onTouchStart(event) {
    if (event.touches.length === 2) {
      event.preventDefault();
      this.isPinching = true;
      this.previousPinchDistance = this._getPinchDistance(event);
    }
  }

  /**
   * Движение pinch
   */
  onTouchMove(event) {
    if (!this.isPinching || event.touches.length !== 2) return;


    const currentDistance = this._getPinchDistance(event);
    const deltaDistance = currentDistance - this.previousPinchDistance;

    const sensitivity = 6;
    const deltaFov = -(deltaDistance * sensitivity);

    let newFov = this.currentFov + deltaFov * 0.2 * (this.currentFov / 240);

    this._onFovChange(newFov);

    this.previousPinchDistance = currentDistance;
  }

  /**
   * Завершение тач-жеста
   */
  onTouchEnd(event) {
    event.preventDefault();
    if (event.touches.length < 2) {
      this.isPinching = false;
      this.previousPinchDistance = 0;
    }
  }

  /**
   * Расстояние между двумя пальцами
   */
  _getPinchDistance(event) {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Вызов в animate loop, чтобы OrbitControls обновлялись
   */
  update() {
    this.updateLockTarget();
    this.controls.update();
  }

  lockTarget(target) {
    this.target = target;
  }

  updateLockTarget() {
    if (!this.target) return;
    let ra = this.target.ra;
    let dec = this.target.dec;
    this.controls.minPolarAngle = Math.PI / 2 + dec;
    this.controls.maxPolarAngle = Math.PI / 2 + dec;
    this.controls.minAzimuthAngle = ra;
    this.controls.maxAzimuthAngle = ra;
  }

  unlockTarget() {
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minAzimuthAngle = 0;
    this.controls.maxAzimuthAngle = Math.PI * 2;
  }


  /**
   * cleanup
   */
  dispose() {
    this.domElement.removeEventListener('wheel', this.onWheel);

    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
    this.domElement.removeEventListener('touchcancel', this.onTouchEnd);

    if (this.controls && this.controls.dispose) {
      this.controls.dispose();
    }
  }

  /**
   * Fov to camera distance from center 
   */
  _mapFovToDistance(fov) {

    if (fov <= 60) {
      return 0.01;
    }

    return 7 / 60 * fov - 7;
  }

}
