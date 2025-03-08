<template>
  <div class="three-container" ref="threeContainer"></div>

  <div id="hud">
    <pre id="fovValue" ref="hudRef">HUD ...</pre>
  </div>

  <div id="time-selector-wrapper">
    <TimeSelector ref="timeSelectorRef" @time-changed="onTimeChanged" />
  </div>

</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import SceneManager from '@/managers/SceneManager.js';
import StarManager from '@/managers/StarManager.js';
import ControlsManager from '@/managers/ControlsManager';
import GridManager from '@/managers/GridManager';
import CelestialManager from '@/managers/CelestialManager';
import UIManager from '@/managers/UIManager';
import TimeSelector from '@/components/TimeSelector.vue';
import HealpixManager from '@/managers/HealpixManager';

export default {
  name: 'Scene',
  components: {
    TimeSelector,
  },
  setup() {
    const threeContainer = ref(null);
    const hudRef = ref(null);
    const timeSelectorRef = ref(null);

    let sceneManager = null;
    let starManager = null;
    let updateStarsInterval = null;
    let controlsManager = null;
    let gridManager = null;
    let celestialManager = null;
    let uiManager = null;
    let deepSkyManager = null;
    let healpixManager = null;

    const debugList = ref([0, 0, 0, 0]);


    const onTimeChanged = (newDate) => {

      const observer = {
        latitude: 59.9343,
        longitude: 30.3351,
        height: 0,
      };

//      starManager.updateStars();
      celestialManager.updatePositions(newDate, observer);
      celestialManager.update();
    };

    onMounted(() => {
      sceneManager = new SceneManager(threeContainer.value);
      gridManager = new GridManager(sceneManager.scene);
      controlsManager = new ControlsManager(
        sceneManager.camera,
        sceneManager.renderer.domElement
      );
      starManager = new StarManager(sceneManager.camera, sceneManager.scene);
      celestialManager = new CelestialManager(sceneManager.camera, sceneManager.scene)
      uiManager = new UIManager(hudRef.value);
      healpixManager = new HealpixManager(sceneManager.scene);
      healpixManager.update();


      
      // ≥controlsManager.lockTarget(celestialManager.bodies[3]);

      sceneManager.startAnimationLoop((deltaTime, elapsedTime, scene, camera) => {
        
        controlsManager.update();
        celestialManager.update();
        try {
          //const pos = celestialManager.moon.pointPosition;
          //sceneManager.camera.lookAt(pos);
        } catch {
          
        }
    
        
        const text =
          `tiles_loaded: ` + healpixManager.tileManager.currentTiles.length + `\n` + 
          `fov: ${camera.fov.toFixed(2)}
          ` + (starManager.isLoading ? '\nloading stars...' : '');
        uiManager.updateHUD(text);
        healpixManager.setOrder(sceneManager.camera);
      });

      

      controlsManager.onFovChanged = (newFov) => {
        celestialManager.update();
        //starManager.updateFOV();
      }

      window.app = {
        debugList,
        updateXYZ: (newX, newY, newZ) => {
          debugList.value[0] = newX;
          debugList.value[1] = newY;
          debugList.value[2] = newZ;
          healpixManager.subdivide();
        },
      };
    });

    onBeforeUnmount(() => {
      if (sceneManager) {
        //sceneManager.dispose();
        sceneManager = null;
      }
      if (updateStarsInterval) {
        //clearInterval(updateStarsInterval);
        updateStarsInterval = null;
      }
      if (controlsManager) {
        //controlsManager.dispose();
        controlsManager = null;
      }
      if (starManager) {
        // starManager.dispose();
        starManager = null;
      }
      if (gridManager) {
        //gridManager.dispose();
        gridManager = null;
      }
      if (uiManager) {
        //uiManager.dispose();
        uiManager = null;
      }
      if (celestialManager) {
        //celestialManager.dispose();
        celestialManager = null;
      }
    });

    return {
      threeContainer,
      hudRef,
      timeSelectorRef,
      debugList,
      onTimeChanged
    };
  }
};
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#hud {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  z-index: 999;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
}

#time-selector-wrapper {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}
</style>