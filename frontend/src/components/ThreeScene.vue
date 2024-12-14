<template>
  <div id="app">
    <div ref="threeContainer" class="three-container"></div>
    <div id="hud">
      <pre id="fovValue">75</pre>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as StarCache from '/src/utils/starsCache.js';
import {cartesian_to_equatorial, getVisiblePixels, prepareStarsGeometry} from "@/utils/algos.js";
import {createStarMaterial} from "/src/utils/starShader.js";

export default {
  name: "StarScene",
  data() {
    return {
      camera: null,
      controls: null,
      visible_healpixels: null,
      scene: null,
      isLoading: false,
    };
  },
  mounted() {
    this.initThree();
  },
  methods: {
    async fetchStarsHeal(nside, pix) {
      const params = new URLSearchParams({nside, pix});
      const url = `/api/stars/get?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      return await response.json();
    },


    async updateStars() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        this.visible_healpixels = getVisiblePixels(direction.toArray(), this.camera.fov);

        const fetchPromises = [];

        for (const [nside, ipix] of this.visible_healpixels) {
          if (!StarCache.hasData(nside, ipix)) {
            const fetchPromise = (async () => {
              const stars_data = await this.fetchStarsHeal(nside, ipix);
              const {positions, vmags} = prepareStarsGeometry(stars_data);

              const geometry = new THREE.BufferGeometry();
              geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
              geometry.setAttribute('vmag', new THREE.Float32BufferAttribute(vmags, 1));

              const points = new THREE.Points(geometry, this.starMaterial);

              StarCache.addStarList(nside, ipix, points);
              this.scene.add(StarCache.getStars(nside, ipix));
            })();

            fetchPromises.push(fetchPromise);
          }
        }

        await Promise.all(fetchPromises);

      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    }
    ,

    async initThree() {
      const scene = new THREE.Scene();
      this.scene = scene;

      this.camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
      );

      this.camera.position.set(0, 0, 0.01);
      this.camera.up.set(0, 1, 0);
      this.camera.fov = 120;


      const renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      this.$refs.threeContainer.appendChild(renderer.domElement);

      this.controls = new OrbitControls(this.camera, renderer.domElement);
      this.controls.rotateSpeed = -1;
      this.controls.enableZoom = false;
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.2;
      this.controls.minDistance = 7;
      this.controls.maxDistance = 7;

      this.camera.updateProjectionMatrix();


      this.visible_healpixels = new Set();
      const refreshRate = 1000; // В миллисекундах

      this.starMaterial = createStarMaterial();


      setInterval(this.updateStars.bind(this), refreshRate);

      // Добавляем вспомогательные линии (экватор, меридианы, параллели)
      const radius = 10;
      const segments = 256;
      const meridians = 24;
      const parallels = 9;
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
      });

      this.addEquator(scene, radius, segments, lineMaterial);
      this.addMeridians(scene, radius, segments, meridians, lineMaterial);
      this.addParallels(scene, radius, segments, parallels, lineMaterial);

      // Слушатель изменения FOV
      window.addEventListener("wheel", async (event) => {
        const thresholds = [120, 60, 30, 15, 5, 1];
        const prev_fov = this.camera.fov;


        this.controls.rotateSpeed = -1 * this.camera.fov / 200;
        this.camera.fov += event.deltaY * 0.05 * (this.camera.fov / 60);
        this.camera.fov = Math.max(0.01, Math.min(120, this.camera.fov));
        this.starMaterial.uniforms.fov.value = this.camera.fov;

        if (this.camera.fov <= 60) {
          this.controls.minDistance = 0.1;
          this.controls.maxDistance = 0.1;
        } else {
          const dist = 7 / 60 * this.camera.fov - 7;
          this.controls.minDistance = dist;
          this.controls.maxDistance = dist;
        }

        this.camera.updateProjectionMatrix();

        for (let i = 0; i < thresholds.length; i++) {
          // fov увеличился, перейдя через thresholds[i].
          if (prev_fov < thresholds[i] && thresholds[i] <= this.camera.fov) {
            await this.updateStars();
          }

          // fov уменьшился, перейдя через thresholds[i].
          if (this.camera.fov < thresholds[i] && thresholds[i] <= prev_fov) {
            await this.updateStars();
          }
        }
      });


      const generateHudText = () => {
        let cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection = cameraDirection.toArray();
        const equatorial_dir = cartesian_to_equatorial(...cameraDirection).map(value => (value * 180 / Math.PI).toFixed(2));
        return (
            "fov: " + this.camera.fov.toFixed(3).toString() + '\n' +
            "polar: " + this.controls.getPolarAngle().toFixed(2) + ' ' +
            "azimuthal: " + this.controls.getAzimuthalAngle().toFixed(2) + '\n' +
            'cartesian dir: ' + cameraDirection.map(value => value.toFixed(2)).join(', ') + '\n' +
            'ra: ' + equatorial_dir[0] + ' de: ' + equatorial_dir[1] + '\n' +
            (this.isLoading ? 'Loading stars...' : '')
        );
      };

      const animate = () => {
        document.getElementById('fovValue').textContent = generateHudText();
        this.controls.update();
        renderer.render(scene, this.camera);
      };
      renderer.setAnimationLoop(animate);


      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    },


    addEquator(scene, radius, segments, material) {
      const equatorGeometry = new THREE.BufferGeometry();
      const equatorVertices = [];

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        equatorVertices.push(
            radius * Math.cos(angle),
            0,
            radius * Math.sin(angle)
        );
      }

      equatorGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(equatorVertices, 3)
      );
      const equatorLine = new THREE.Line(equatorGeometry, material);
      scene.add(equatorLine);
    },


    addMeridians(scene, radius, segments, count, material) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const meridianGeometry = new THREE.BufferGeometry();
        const meridianVertices = [];

        for (let j = 0; j <= segments; j++) {
          const theta = (j / segments) * Math.PI;
          meridianVertices.push(
              radius * Math.sin(theta) * Math.cos(angle),
              radius * Math.cos(theta),
              radius * Math.sin(theta) * Math.sin(angle)
          );
        }

        meridianGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(meridianVertices, 3)
        );
        const meridianLine = new THREE.Line(meridianGeometry, material);
        scene.add(meridianLine);
      }
    },

    addParallels(scene, radius, segments, count, material) {
      for (let i = 1; i <= count; i++) {
        const theta = (i / (count + 1)) * Math.PI;
        const parallelGeometry = new THREE.BufferGeometry();
        const parallelVertices = [];

        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          parallelVertices.push(
              radius * Math.sin(theta) * Math.cos(angle),
              radius * Math.cos(theta),
              radius * Math.sin(theta) * Math.sin(angle)
          );
        }

        parallelGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(parallelVertices, 3)
        );
        const parallelLine = new THREE.Line(parallelGeometry, material);
        scene.add(parallelLine);
      }
    },
  },
};
</script>

<style>
.three-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#hud {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  border-radius: 5px;
}
</style>
