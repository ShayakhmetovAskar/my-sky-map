import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { equatorial_to_cartesian, cartesian_to_equatorial } from '@/utils/algos';

const _mouseNDC = new THREE.Vector2();
const _ray = new THREE.Raycaster();
const _sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 10);
const _hitTarget = new THREE.Vector3();

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
    this.controls.enableRotate = false; // we handle rotation ourselves
    this.controls.enableZoom = false;
    this.controls.touches.TWO = OrbitControls.TOUCH_NONE;

    this.controls.minDistance = 7;
    this.controls.maxDistance = 7;

    this.isPinching = false;
    this.previousPinchDistance = 0;

    // Drag state
    this._isDragging = false;
    this._prevDragX = 0;
    this._prevDragY = 0;

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

    // Drag (grab & hold)
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    this.domElement.addEventListener('pointermove', this._onPointerMove);
    this.domElement.addEventListener('pointerup', this._onPointerUp);
    this.domElement.addEventListener('pointerleave', this._onPointerUp);
    this.domElement.addEventListener('pointercancel', this._onPointerUp);

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

  // ── Grab & hold drag ──────────────────────────────────────────────────

  _onPointerDown(event) {
    if (event.button !== 0 || this.isPinching) return;
    this._isDragging = true;
    this.userIsInteracting = true;
    this._removeConstraints();
    this._prevDragX = event.clientX;
    this._prevDragY = event.clientY;
  }

  _onPointerMove(event) {
    if (!this._isDragging || this.isPinching) return;

    // Unproject previous and current screen points → spherical coords on sky sphere
    const prev = this._screenToSpherical(this._prevDragX, this._prevDragY);
    const cur = this._screenToSpherical(event.clientX, event.clientY);

    if (prev && cur) {
      // Spherical delta
      const deltaAz = cur.az - prev.az;
      const deltaPhi = cur.alt - prev.alt;

      // Apply through OrbitControls' internal delta (handles clamping, no gimbal lock)
      this.controls._rotateLeft(deltaAz);
      this.controls._rotateUp(deltaPhi);
    }

    this._prevDragX = event.clientX;
    this._prevDragY = event.clientY;
  }

  /**
   * Unproject screen point → intersect sky sphere → spherical coordinates (az, alt)
   */
  _screenToSpherical(clientX, clientY) {
    const hit = this._raycastSphere(clientX, clientY);
    if (!hit) return null;
    // Convert to spherical: azimuth (around Y) and altitude (from XZ plane)
    const r = hit.length();
    const alt = Math.asin(THREE.MathUtils.clamp(hit.y / r, -1, 1));
    const az = Math.atan2(hit.x, hit.z);
    return { az, alt };
  }

  /**
   * Cast ray from camera through screen point, intersect with sky sphere (R=10).
   * Returns world-space hit point or null.
   */
  _raycastSphere(clientX, clientY) {
    const rect = this.domElement.getBoundingClientRect();
    _mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _ray.setFromCamera(_mouseNDC, this.camera);
    return _ray.ray.intersectSphere(_sphere, _hitTarget) ? _hitTarget.clone() : null;
  }

  _onPointerUp() {
    if (!this._isDragging) return;
    this._isDragging = false;
    this.userIsInteracting = false;

    // Sync OrbitControls with final camera position (once, after drag)
    this.controls.update();

    if (this.trackingMode === 'celestial' && this.trackedCelestialObject) {
      this._updateCelestialTrackingOffset();
    } else if (this.target && this.trackingMode === 'fixed') {
      this._updateTargetFromCameraView();
    }
  }

  _pointCameraAt(raDeg, decDeg) {
    const ra_rad = raDeg * Math.PI / 180;
    const dec_rad = decDeg * Math.PI / 180;
    const [x, y, z] = equatorial_to_cartesian(ra_rad, dec_rad, 10);
    const vector = new THREE.Vector3(x, y, z);
    vector.applyQuaternion(this.skyGroup.quaternion.clone());
    const [ra_scene, dec_scene] = cartesian_to_equatorial(vector.x, vector.y, vector.z);

    this.controls.minPolarAngle = Math.PI / 2 + dec_scene;
    this.controls.maxPolarAngle = Math.PI / 2 + dec_scene;
    this.controls.minAzimuthAngle = ra_scene;
    this.controls.maxAzimuthAngle = ra_scene;
    this.controls.update();
    this._removeConstraints();
  }

  _onFovChange(newFov) {
    newFov = THREE.MathUtils.clamp(newFov, this.fovMin, this.fovMax);
    this.currentFov = newFov;

    this.camera.fov = newFov;
    this.camera.updateProjectionMatrix();

    this.controls.minDistance = this._mapFovToDistance(newFov);
    this.controls.maxDistance = this._mapFovToDistance(newFov);

    if (this.onFovChanged) {
      this.onFovChanged(newFov);
    }
  }

  setFov(newFov) {
    this._onFovChange(newFov);
  }

  // ── PROTOTYPE APO-85: smooth flight to a sky position ──────────────────────
  /** World-space unit vector pointing at (ra, dec) in degrees, including the skyGroup rotation. */
  _skyDirection(raDeg, decDeg) {
    const ra = THREE.MathUtils.degToRad(raDeg);
    const dec = THREE.MathUtils.degToRad(decDeg);
    const p = new THREE.Vector3(-Math.cos(dec) * Math.sin(ra), Math.sin(dec), -Math.cos(dec) * Math.cos(ra));
    if (this.skyGroup) p.applyQuaternion(this.skyGroup.quaternion);
    return p.normalize();
  }

  /**
   * Fly to (raDeg, decDeg) and end at fovDeg. Great-circle path, fov interpolated in log space
   * with a "zoom-out bump" on long hops (like Google Earth), ease-in-out. Any user input cancels.
   * Returns a promise resolved when the flight ends (true) or is cancelled (false).
   */
  flyTo(raDeg, decDeg, fovDeg, { duration } = {}) {
    this.cancelFlight();
    this.unlockTarget();

    const start = this.camera.position.clone().normalize().negate(); // camera looks through the origin
    const target = this._skyDirection(raDeg, decDeg);
    const angleDeg = THREE.MathUtils.radToDeg(start.angleTo(target));
    const f0 = this.currentFov;
    const f1 = THREE.MathUtils.clamp(fovDeg, this.fovMin, this.fovMax);
    const dur = (duration ?? Math.min(2.0, 0.6 + 0.3 * angleDeg / 30)) * 1000;
    // zoom out mid-flight so the hop stays readable; nothing for tiny hops, up to x4 for long ones
    const bump = Math.log(1 + Math.min(3, Math.max(0, angleDeg - 2) / 25));
    const rot = new THREE.Quaternion().setFromUnitVectors(start, target);
    const identity = new THREE.Quaternion();
    const t0 = performance.now();
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    return new Promise(resolve => {
      const step = now => {
        if (this._flight !== step) return resolve(false);
        if (this.userIsInteracting || this._isDragging) { this._flight = null; return resolve(false); }
        const t = Math.min(1, (now - t0) / dur);
        const e = ease(t);
        const dir = start.clone().applyQuaternion(identity.clone().slerp(rot, e));
        const fov = Math.exp(THREE.MathUtils.lerp(Math.log(f0), Math.log(f1), e) + bump * Math.sin(Math.PI * t));
        const dist = this.camera.position.length();
        this.camera.position.copy(dir.multiplyScalar(-dist));
        this._onFovChange(Math.min(fov, this.fovMax));
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          this._flight = null;
          resolve(true);
        }
      };
      this._flight = step;
      requestAnimationFrame(step);
    });
  }

  cancelFlight() {
    this._flight = null;
  }

  onWheel(event) {
    event.preventDefault();
    this.cancelFlight();
    const delta = event.deltaY * 0.05 * (this.currentFov / 60);
    const newFov = THREE.MathUtils.clamp(this.currentFov + delta, this.fovMin, this.fovMax);

    if (this.trackingMode) {
      this._onFovChange(newFov);
      return;
    }

    this._zoomTowardScreen(event.clientX, event.clientY, newFov);
  }

  /**
   * Zoom toward a specific screen point using spherical delta.
   * Same approach as drag: compare sphere intersection before/after FOV change.
   */
  _zoomTowardScreen(clientX, clientY, newFov) {
    // 1. Get current camera center RA/Dec
    const centerCoords = this.getCurrentCameraViewCoordinates();
    if (!centerCoords) { this._onFovChange(newFov); return; }

    // 2. Get RA/Dec under cursor
    const hit = this._raycastSphere(clientX, clientY);
    if (!hit) { this._onFovChange(newFov); return; }
    const hitDir = hit.clone().normalize();
    hitDir.applyQuaternion(this.skyGroup.quaternion.clone().invert());
    const [cursorRA, cursorDec] = cartesian_to_equatorial(hitDir.x, hitDir.y, hitDir.z);
    const cursorRA_deg = cursorRA * 180 / Math.PI;
    const cursorDec_deg = cursorDec * 180 / Math.PI;

    // 3. Interpolation factor
    const oldFov = this.currentFov;
    const ratio = 1 - newFov / oldFov;

    // 4. Interpolate RA/Dec toward cursor (shortest path for RA)
    let deltaRA = cursorRA_deg - centerCoords.ra_deg;
    if (deltaRA > 180) deltaRA -= 360;
    if (deltaRA < -180) deltaRA += 360;
    let newRA = centerCoords.ra_deg + deltaRA * ratio;
    let newDec = centerCoords.dec_deg + (cursorDec_deg - centerCoords.dec_deg) * ratio;

    newDec = THREE.MathUtils.clamp(newDec, -89.99, 89.99);
    newRA = ((newRA % 360) + 360) % 360;

    // 5. Apply FOV change
    this._onFovChange(newFov);

    // 6. Point camera at new RA/Dec via constraints
    this._pointCameraAt(newRA, newDec);
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
    const newFov = this.currentFov + deltaFov * 0.2 * (this.currentFov / 240);

    if (this.trackingMode) {
      this._onFovChange(newFov);
      this.previousPinchDistance = currentDistance;
      return;
    }

    const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    this._zoomTowardScreen(midX, midY, newFov);

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

    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    this.domElement.removeEventListener('pointermove', this._onPointerMove);
    this.domElement.removeEventListener('pointerup', this._onPointerUp);
    this.domElement.removeEventListener('pointerleave', this._onPointerUp);
    this.domElement.removeEventListener('pointercancel', this._onPointerUp);

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
