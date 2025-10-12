import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { equatorial_to_cartesian, cartesian_to_equatorial } from '@/utils/algos';

export default class ControlsManager {
  /**
   * @param {THREE.Camera} camera - Камера Three.js
   * @param {HTMLCanvasElement} domElement - Canvas, к которому прикрепляются OrbitControls
   * @param {THREE.Group} skyGroup - Группа неба для преобразования координат
   */
  constructor(camera, domElement, skyGroup = null) {
    this.camera = camera;
    this.skyGroup = skyGroup;
    this.domElement = domElement;

    this.target = null;
    
    // Трекинг небесных объектов
    this.celestialManager = null;
    this.trackedCelestialObject = null;
    this.trackingMode = null; // null | 'fixed' | 'celestial'
    this.trackingOffset = { ra: 0, dec: 0 }; // Смещение от объекта в градусах

    this.fovMin = 0.01;
    this.fovMax = 120;

    this.currentFov = camera.fov;
    this.onFovChanged = null; // Коллбек при изменении fov вешается в родителе
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

    // Отслеживание взаимодействия пользователя
    this.userIsInteracting = false;

    this._bindEvents();
    this._bindTrackingEvents();
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

  /**
   * Привязываем события OrbitControls для отслеживания взаимодействия пользователя
   */
  _bindTrackingEvents() {
    this.controls.addEventListener('start', () => {
      this.userIsInteracting = true;
      // При начале взаимодействия снимаем ограничения
      this._removeConstraints();
    });

    this.controls.addEventListener('end', () => {
      this.userIsInteracting = false;
      
      // При окончании взаимодействия обновляем offset для celestial трекинга
      if (this.trackingMode === 'celestial' && this.trackedCelestialObject) {
        this._updateCelestialTrackingOffset();
      }
      // Для fixed трекинга вычисляем новый target
      else if (this.target && this.trackingMode === 'fixed') {
        this._updateTargetFromCameraView();
      }
    });
  }

  /**
   * Обновляет offset для celestial трекинга при окончании взаимодействия пользователя
   * @private
   */
  _updateCelestialTrackingOffset() {
    if (!this.celestialManager?.bodies) return;
    
    // Получаем текущую позицию отслеживаемого объекта
    const trackedBody = this.celestialManager.bodies.find(
      body => body.name === this.trackedCelestialObject
    );
    
    if (!trackedBody || trackedBody.ra === undefined || trackedBody.dec === undefined) return;
    
    // Получаем текущее направление взгляда камеры
    const cameraCoords = this.getCurrentCameraViewCoordinates();
    if (!cameraCoords) return;
    
    // Вычисляем offset как разность между направлением камеры и позицией объекта
    const objectRaDeg = trackedBody.ra * 180 / Math.PI;
    const objectDecDeg = trackedBody.dec * 180 / Math.PI;
    
    this.trackingOffset.ra = cameraCoords.ra_deg - objectRaDeg;
    this.trackingOffset.dec = cameraCoords.dec_deg - objectDecDeg;
    
    console.log('🎯 Обновлен offset трекинга:', this.trackingOffset);
  }

  /**
   * Снимаем все ограничения углов для свободного движения камеры
   */
  _removeConstraints() {
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
  }

  /**
   * Публичный метод для получения координат направления взгляда камеры
   * @returns {Object} объект с координатами { ra_deg, dec_deg } или null
   */
  getCurrentCameraViewCoordinates() {
    if (!this.skyGroup) return null;

    // Получаем текущее направление камеры
    const cameraDir = new THREE.Vector3(0, 0, -1);
    cameraDir.applyQuaternion(this.camera.quaternion);
    
    // Применяем инвертированный кватернион skyGroup для получения координат в системе неба
    cameraDir.applyQuaternion(this.skyGroup.quaternion.clone().invert());
    
    // Преобразуем в экваториальные координаты
    const [current_ra, current_dec] = cartesian_to_equatorial(cameraDir.x, cameraDir.y, cameraDir.z);
    
    // Переводим радианы в градусы
    const current_ra_deg = current_ra * 180 / Math.PI;
    const current_dec_deg = current_dec * 180 / Math.PI;
    
    return { ra_deg: current_ra_deg, dec_deg: current_dec_deg };
  }

  /**
   * Вычисляем новый target на основе текущего направления взгляда камеры
   */
  _updateTargetFromCameraView() {
    const coordinates = this.getCurrentCameraViewCoordinates();
    if (coordinates) {
      // Обновляем target на новую позицию взгляда
      this.target = { ra: coordinates.ra_deg, dec: coordinates.dec_deg };
    }
  }

  _onFovChange(newFov) {
    newFov = THREE.MathUtils.clamp(newFov, this.fovMin, this.fovMax);
    this.currentFov = newFov;

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
    this._updateCelestialTracking();
    this.updateLockTarget();
    this.controls.update();
  }

  lockTarget(target) {
    this.target = target;
    this.trackingMode = 'fixed';
    // Сбрасываем celestial трекинг если был активен
    this.trackedCelestialObject = null;
  }

  /**
   * Устанавливает трекинг небесного объекта
   * @param {CelestialManager} celestialManager - Менеджер небесных тел
   * @param {string} objectName - Название объекта для трекинга
   */
  trackCelestialObject(celestialManager, objectName) {
    this.celestialManager = celestialManager;
    this.trackedCelestialObject = objectName;
    this.trackingMode = 'celestial';
    
    // Сбрасываем offset при начале нового трекинга
    this.trackingOffset = { ra: 0, dec: 0 };
    
    // Устанавливаем начальную позицию
    this._updateCelestialTracking();
    
    console.log('🚀 Начат celestial трекинг:', objectName, 'без offset');
  }

  /**
   * Обновляет координаты трекинга для небесных объектов
   * @private
   */
  _updateCelestialTracking() {
    if (this.trackingMode === 'celestial' && 
        this.trackedCelestialObject && 
        this.celestialManager?.bodies) {
      
      const trackedBody = this.celestialManager.bodies.find(
        body => body.name === this.trackedCelestialObject
      );
      
      if (trackedBody && trackedBody.ra !== undefined && trackedBody.dec !== undefined) {
        // Применяем offset к координатам объекта
        this.target = {
          ra: (trackedBody.ra * 180 / Math.PI) + this.trackingOffset.ra,
          dec: (trackedBody.dec * 180 / Math.PI) + this.trackingOffset.dec
        };
      }
    }
  }

  updateLockTarget() {
    if (!this.target || !this.skyGroup) return;
    
    // Если пользователь взаимодействует с камерой - не применяем ограничения
    if (this.userIsInteracting) {
      return;
    }
    
    // 1. Получаем x, y, z из экваториальных координат (конвертируем градусы в радианы)
    const ra_rad = this.target.ra * Math.PI / 180;
    const dec_rad = this.target.dec * Math.PI / 180;
    const [x, y, z] = equatorial_to_cartesian(ra_rad, dec_rad, 10);
    
    // 2. Создаем вектор и применяем инвертированный кватернион skyGroup
    const vector = new THREE.Vector3(x, y, z);
    const invertedQuaternion = this.skyGroup.quaternion.clone();
    vector.applyQuaternion(invertedQuaternion);
    
    // 3. Преобразуем обратно в экваториальные координаты
    const [ra_scene, dec_scene] = cartesian_to_equatorial(vector.x, vector.y, vector.z);
    
    // 4. Устанавливаем ограничения для OrbitControls
    this.controls.minPolarAngle = Math.PI / 2 + dec_scene;
    this.controls.maxPolarAngle = Math.PI / 2 + dec_scene;
    this.controls.minAzimuthAngle = ra_scene;
    this.controls.maxAzimuthAngle = ra_scene;
  }

  unlockTarget() {
    this.target = null;
    this.trackingMode = null;
    this.trackedCelestialObject = null;
    this.celestialManager = null;
    this.trackingOffset = { ra: 0, dec: 0 };
    this._removeConstraints();
  }

  /**
   * Получить информацию о текущем трекинге
   * @returns {Object} - Информация о трекинге
   */
  getTrackingInfo() {
    return {
      mode: this.trackingMode,
      target: this.target,
      celestialObject: this.trackedCelestialObject,
      offset: this.trackingOffset
    };
  }

  /**
   * Проверяет, активен ли трекинг небесного объекта
   * @returns {boolean}
   */
  isCelestialTracking() {
    return this.trackingMode === 'celestial' && this.trackedCelestialObject !== null;
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
