import * as THREE from 'three';

export default class SceneManager {
  constructor(container) {
    this.container = container;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    container.appendChild(this.renderer.domElement);


    this.camera = new THREE.PerspectiveCamera(
      120,                                     // FOV
      window.innerWidth / window.innerHeight,  // aspect
      0.1,                                     // near
      20                                       // far
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
