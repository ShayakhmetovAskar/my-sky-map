import * as THREE from 'three';
import { equatorial_to_cartesian } from '@/utils/algos';
import { CONSTELLATION_NAMES } from '@/data/constellationNames';

const DEG2RAD = Math.PI / 180;

export default class ConstellationManager {
  constructor(skyGroup, radius = 10) {
    this.skyGroup = skyGroup;
    this.radius = radius;
    this.visible = true;

    this.linesGroup = new THREE.Group();
    this.linesGroup.name = 'ConstellationLines';
    this.skyGroup.add(this.linesGroup);

    this.labelsGroup = new THREE.Group();
    this.labelsGroup.name = 'ConstellationLabels';
    this.skyGroup.add(this.labelsGroup);

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x6688cc,
      transparent: true,
      opacity: 0.5,
    });
  }

  async load() {
    const resp = await fetch('/data/constellations.lines.json');
    const geojson = await resp.json();

    for (const feature of geojson.features) {
      const id = feature.id;
      const name = CONSTELLATION_NAMES[id] || id;
      const allRA = [];
      const allDec = [];

      // Lines
      for (const segment of feature.geometry.coordinates) {
        const positions = [];
        for (const [lon, lat] of segment) {
          const ra = ((lon + 360) % 360) * DEG2RAD;
          const dec = lat * DEG2RAD;
          allRA.push(ra);
          allDec.push(dec);
          const [x, y, z] = equatorial_to_cartesian(ra, dec, this.radius);
          positions.push(x, y, z);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const line = new THREE.Line(geo, this.lineMaterial);
        this.linesGroup.add(line);
      }

      // Label at centroid
      if (allRA.length > 0) {
        // Circular mean for RA (handles wrap-around)
        const sinSum = allRA.reduce((s, r) => s + Math.sin(r), 0);
        const cosSum = allRA.reduce((s, r) => s + Math.cos(r), 0);
        const avgRA = Math.atan2(sinSum / allRA.length, cosSum / allRA.length);
        const avgDec = allDec.reduce((s, d) => s + d, 0) / allDec.length;

        const [x, y, z] = equatorial_to_cartesian(
          avgRA < 0 ? avgRA + 2 * Math.PI : avgRA,
          avgDec,
          this.radius
        );

        const sprite = this._createLabel(name);
        sprite.position.set(x, y, z);
        this.labelsGroup.add(sprite);
      }
    }
  }

  _createLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 16;
    const dpi = 2;

    ctx.font = `100 ${fontSize * dpi}px 'Courier New', monospace`;
    const width = ctx.measureText(text).width + 8 * dpi;
    const height = fontSize * dpi + 8 * dpi;

    canvas.width = width;
    canvas.height = height;

    ctx.font = `100 ${fontSize * dpi}px 'Courier New', monospace`;
    ctx.fillStyle = 'rgba(150, 180, 220, 0.35)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, 8 * dpi, 8 * dpi);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      sizeAttenuation: false,
    });

    const sprite = new THREE.Sprite(material);
    const scale = 1 / (20 * dpi);
    sprite.scale.set(width / 10 * scale, height / 10 * scale, 1);
    sprite.userData.baseScale = sprite.scale.clone();

    return sprite;
  }

  update(camera) {
    const fovScale = camera.fov / 120;
    for (const sprite of this.labelsGroup.children) {
      sprite.scale.copy(sprite.userData.baseScale).multiplyScalar(fovScale);
    }
  }

  setVisible(visible) {
    this.visible = visible;
    this.linesGroup.visible = visible;
    this.labelsGroup.visible = visible;
  }

  dispose() {
    for (const line of this.linesGroup.children) {
      line.geometry.dispose();
    }
    for (const sprite of this.labelsGroup.children) {
      if (sprite.material?.map) sprite.material.map.dispose();
      if (sprite.material) sprite.material.dispose();
    }
    this.skyGroup.remove(this.linesGroup);
    this.skyGroup.remove(this.labelsGroup);
    this.lineMaterial.dispose();
  }
}
