import * as THREE from 'three';
import { getZenithRaDecFast } from '@/utils/algos';

export default class SceneManager {
  constructor(container) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.skyGroup = new THREE.Group();
    this.lat = 0;
    

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // белый свет, 50% интенсивности
    this.scene.add(ambientLight);
    this.scene.add(this.skyGroup)
    
    

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(this.renderer.domElement);


    this.camera = new THREE.PerspectiveCamera(
      120,                                     // FOV
      window.innerWidth / window.innerHeight,  // aspect
      0.1,                                     // near
      1000                                      // far
    );

    this.camera.position.set(0, 0, 0.001);
    this.camera.up.set(0, 1, 0);


    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  setSkyNorth(lon, lat) {
    this.lat = lat;
  }

  rotateSky(lon, lat, date) {
    this.skyGroup.quaternion.identity();

    // 2) Рассчитываем нужные углы
    const latRad = (lat - 90) * Math.PI / 180;
    const { ra } = getZenithRaDecFast(date, lat, lon);
    const raRad = ra * Math.PI / 12 - Math.PI / 2;

    // 3) Делаем кватернион для поворота по Z:
    const qZ = new THREE.Quaternion();
    qZ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), latRad);

    // 4) Делаем кватернион для поворота по локальной Y:
    const qY = new THREE.Quaternion();
    qY.setFromAxisAngle(new THREE.Vector3(0, -1, 0), raRad);

    // 5) Перемножаем их в нужном порядке
    //    Сначала повернуть Z (qZ), потом вокруг (уже повернутой) локальной Y (qY)
    qZ.multiply(qY);

    // 6) Применяем результат
    this.skyGroup.quaternion.copy(qZ);
  }

  /**
   * Запуск анимационного цикла
   * @param {Function} onUpdate - функция, которая будет вызвана на каждом кадре
   *    onUpdate(deltaTime, elapsedTime, scene, camera)
   */
  startAnimationLoop(onUpdate) {
    this.renderer.setAnimationLoop(() => {
      const deltaTime = this.clock.getDelta();
      const elapsedTime = this.clock.elapsedTime;

      if (typeof onUpdate === 'function') {
        onUpdate(deltaTime, elapsedTime, this.scene, this.camera);
      }

      this.renderer.render(this.scene, this.camera);
    });
  }

  /**
   * Остановка анимационного цикла (например, при переходе на другую страницу)
   */
  stopAnimationLoop() {
    this.renderer.setAnimationLoop(null);
  }

  /**
   * Уничтожение SceneManager
   */
  dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    this.stopAnimationLoop();
    this.renderer.dispose();
  }
}
