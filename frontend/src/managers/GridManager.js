import * as THREE from 'three';

export default class GridManager {
  /**
   * @param {THREE.Group|THREE.Scene} root
   */
  constructor(root) {
    this.root = root;
    this.radius = 10;
    this.segments = 256;
    this.meridians = 36;
    this.parallels = 17;

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    });

    this.lines = [];

    this._createGrid();
  }

  /**
   * Вызов внутренних методов, которые добавляют экватор, меридианы и параллели
   */
  _createGrid() {
    this._addMeridians();
    this._addParallels();
  }

  /**
   * Меридианы — вертикальные полукольца вокруг оси от полюса к полюсу
   */
  _addMeridians() {
    for (let i = 0; i < this.meridians; i++) {
      const angle = (i / this.meridians) * Math.PI * 2;
      const meridianGeometry = new THREE.BufferGeometry();
      const meridianVertices = [];

      for (let j = 0; j <= this.segments; j++) {
        const theta = (j / this.segments) * Math.PI;
        meridianVertices.push(
          this.radius * Math.sin(theta) * Math.cos(angle),
          this.radius * Math.cos(theta),
          this.radius * Math.sin(theta) * Math.sin(angle)
        );
      } 

      meridianGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(meridianVertices, 3)
      );

      const meridianLine = new THREE.Line(meridianGeometry, this.lineMaterial);
      this.root.add(meridianLine);
      this.lines.push(meridianLine);
    }
  }

  /**
   * Параллели — горизонтальные «окружности» вдоль оси Y
   */
  _addParallels() {
    for (let i = 1; i <= this.parallels; i++) {
      const theta = (i / (this.parallels + 1)) * Math.PI;
      const parallelGeometry = new THREE.BufferGeometry();
      const parallelVertices = [];

      for (let j = 0; j <= this.segments; j++) {
        const angle = (j / this.segments) * Math.PI * 2;
        parallelVertices.push(
          this.radius * Math.sin(theta) * Math.cos(angle),
          this.radius * Math.cos(theta),
          this.radius * Math.sin(theta) * Math.sin(angle)
        );
      }

      parallelGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(parallelVertices, 3)
      );

      const parallelLine = new THREE.Line(parallelGeometry, this.lineMaterial);
      this.root.add(parallelLine);
      this.lines.push(parallelLine);
    }
  }

  dispose() {
    for (const line of this.lines) {
      this.root.remove(line);
      line.geometry.dispose();
      line.lineMaterial.dispose();
    }
    this.lines = [];
  }
}
