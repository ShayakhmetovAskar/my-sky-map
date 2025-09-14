<template>
  <div class="three-container" ref="threeContainer"></div>

  <div id="hud">
    <pre id="fovValue" ref="hudRef">HUD ...</pre>
  </div>

  <div id="time-selector-wrapper">
    <TimeSelector ref="timeSelectorRef" @time-changed="onTimeChanged" @ready="onTimeSelectorReady" />
    <div class="button-row">
      <LocationSelector ref="locationSelectorRef" @location-changed="onLocationChanged" />
      <TerrainToggleButton @toggle-terrain="onTerrainToggle" />
    </div>

    <div v-if="taskId" class="transparency-slider-container">
      <div class="slider-label">Overlay Transparency</div>
      <div class="slider-with-value">
        <input type="range" min="0" max="1" step="0.01" v-model="overlayOpacity" @input="updateOverlayOpacity"
          class="transparency-slider" />
        <span class="opacity-value">{{ Math.round(overlayOpacity) }}%</span>
      </div>
    </div>
  </div>




</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
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
import OverlayManager from '@/managers/OverlayManager';
import { getWorldUp } from '@/utils/algos';




export default {
  name: 'Scene',
  components: {
    TimeSelector,
    LocationSelector,
    TerrainToggleButton,
  },
  props: {
    taskId: {
      type: [String],
      required: true // or default: null if null is valid
    }
  },
  setup(props) {
    const threeContainer = ref(null);
    const hudRef = ref(null);
    const timeSelectorRef = ref(null);
    const locationSelectorRef = ref(null);
    const terrainToggleButton = ref(null);
    const overlayOpacity = ref(1);

    let sceneManager = null;
    let updateStarsInterval = null;
    let controlsManager = null;
    let gridManager = null;
    let celestialManager = null;
    let uiManager = null;
    let groundManager = null;
    let healpixManager = null;
    let overlayManager = null;

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

    const updateOverlayOpacity = () => {
      if (overlayManager) {
        overlayManager.setOverlaysOpacity(overlayOpacity.value);
      }
    };

    onMounted(() => {
      sceneManager = new SceneManager(threeContainer.value);
      sceneManager.rotateSky(observer.longitude, observer.latitude, new Date());
      
      gridManager = new GridManager(sceneManager.skyGroup);
      controlsManager = new ControlsManager(
        sceneManager.camera,
        sceneManager.renderer.domElement
      );

      celestialManager = new CelestialManager(sceneManager.camera, sceneManager.skyGroup);
      celestialManager.updatePositions(new Date(), observer);
      uiManager = new UIManager(hudRef.value);
      healpixManager = new HealpixManager(sceneManager.skyGroup);
      groundManager = new GroundManager(sceneManager.scene);
      overlayManager = new OverlayManager(sceneManager.skyGroup, controlsManager);

      if (props.taskId) {
        groundManager.setVisible(false);
        overlayManager.overlay(props.taskId);
      }

      healpixManager.update();


      sceneManager.startAnimationLoop((deltaTime, elapsedTime, scene, camera) => {
        controlsManager.update();
        celestialManager.update(sceneManager.getUp());

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
          controlsManager.camera.position.set(-newX, -newY, -newZ);
        },
      };
    });

    function onTimeSelectorReady() {
      if (props.taskId) {
        timeSelectorRef.value.stopTimer();
      }
    }

    watch(() => props.taskId, (newTaskId) => {
      groundManager.setVisible(false);
      if (newTaskId && overlayManager) {
        overlayManager.overlay(newTaskId);
      }
      if (!newTaskId && overlayManager) {
        overlayManager.removeAllOverlays();
      }
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
      onTerrainToggle,
      updateOverlayOpacity,
      overlayOpacity,
      onTimeSelectorReady,
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