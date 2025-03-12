<template>
  <div class="three-container" ref="threeContainer"></div>

  <div id="hud">
    <pre id="fovValue" ref="hudRef">HUD ...</pre>
  </div>

  <div id="time-selector-wrapper">
    <TimeSelector ref="timeSelectorRef" @time-changed="onTimeChanged" />
    <div class="button-row">
      <LocationSelector ref="locationSelectorRef" @location-changed="onLocationChanged" />
      <TerrainToggleButton @toggle-terrain="onTerrainToggle" />
    </div>
  </div>

</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import SceneManager from '@/managers/SceneManager.js';
import ControlsManager from '@/managers/ControlsManager';
import GridManager from '@/managers/GridManager';
import CelestialManager from '@/managers/CelestialManager';
import UIManager from '@/managers/UIManager';
import GroundManager from '@/managers/GroundManager';
import TimeSelector from '@/components/TimeSelector.vue';
import TerrainToggleButton from '@/components/TerrainToggleButton.vue';
import LocationSelector from '@/components/LocationSelector.vue';
import HealpixManager from '@/managers/HealpixManager';
import { getWorldUp } from '@/utils/algos';

export default {
  name: 'Scene',
  components: {
    TimeSelector,
    LocationSelector,
    TerrainToggleButton,
  },
  setup() {
    const threeContainer = ref(null);
    const hudRef = ref(null);
    const timeSelectorRef = ref(null);
    const locationSelectorRef = ref(null);
    const terrainToggleButton = ref(null);

    let sceneManager = null;
    let updateStarsInterval = null;
    let controlsManager = null;
    let gridManager = null;
    let celestialManager = null;
    let uiManager = null;
    let groundManager = null;
    let healpixManager = null;

    const debugList = ref([0, 0, 0, 0]);

    const observer = {
      latitude: 59.9343,
      longitude: 30.3351,
      height: 0,
    };

    const onTimeChanged = (newDate) => {

      if (!celestialManager) {
        return;
      }

      celestialManager.updatePositions(newDate, observer);
      celestialManager.update();

      if (!sceneManager)
        return;

      sceneManager.rotateSky(observer.longitude, observer.latitude, newDate);
    };

    const onLocationChanged = (newLocation) => {
      observer.latitude = newLocation.latitude;
      observer.longitude = newLocation.longitude;
      sceneManager.setSkyNorth(observer.longitude, observer.latitude);
    };

    const onTerrainToggle = () => {
      if (groundManager && groundManager.groundMesh) {
        const newVisible = !groundManager.groundMesh.visible;
        groundManager.setVisible(newVisible);
      }
    };

    onMounted(() => {
      sceneManager = new SceneManager(threeContainer.value);
      gridManager = new GridManager(sceneManager.skyGroup);
      controlsManager = new ControlsManager(
        sceneManager.camera,
        sceneManager.renderer.domElement
      );

      celestialManager = new CelestialManager(sceneManager.camera, sceneManager.skyGroup);
      uiManager = new UIManager(hudRef.value);
      healpixManager = new HealpixManager(sceneManager.skyGroup);
      groundManager = new GroundManager(sceneManager.scene);
      healpixManager.update();

    
      sceneManager.startAnimationLoop((deltaTime, elapsedTime, scene, camera) => {
        controlsManager.update();
        celestialManager.update();

        const text =
          `tiles_loaded: ` + healpixManager.tileManager.currentTiles.length + `\n` +
          `fov: ${camera.fov.toFixed(2)}`;
        uiManager.updateHUD(text);
        healpixManager.setOrder(sceneManager.camera);
        //sceneManager.skyGroup.rotateY(scene.skyGroup.rotation + 0.0001);
  
        
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
      locationSelectorRef,
      terrainToggleButton,
      debugList,
      onTimeChanged,
      onLocationChanged,
      onTerrainToggle
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

.button-row {
  display: flex;
  gap: 10px;
}
</style>