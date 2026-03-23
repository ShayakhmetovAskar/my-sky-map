<template>
  <div class="three-container" ref="threeContainer"></div>

  <div id="hud">
    <pre id="fovValue" ref="hudRef">HUD ...</pre>
  </div>

  <!-- Side Menu -->
  <SideMenu
    :latitude="observerLat"
    :longitude="observerLon"
    :terrain="terrainOn"
    :tracking="isTracking"
    @location-changed="onLocationChanged"
    @toggle-terrain="onTerrainToggle"
    @toggle-tracking="onToggleTracking"
  />

  <!-- Bottom Bar: time + ground + tracking -->
  <TimeSelectorV2 ref="timeSelectorRef"
    :ground="terrainOn"
    :tracking="isTracking"
    @time-changed="onTimeChanged"
    @ready="onTimeSelectorReady"
    @toggle-terrain="onTerrainToggle"
    @toggle-tracking="onToggleTracking"
  />

  <!-- Overlay Controls (when viewing solved image) -->
  <div v-if="taskId" class="overlay-controls">
    <div class="overlay-mode-toggle">
      <button :class="{ active: overlayMode === 'original' }" @click="setMode('original')">Original</button>
      <button :class="{ active: overlayMode === 'annotated' }" @click="setMode('annotated')">Annotated</button>
      <button :class="{ active: overlayMode === 'off' }" @click="setMode('off')">Off</button>
    </div>
    <div v-if="overlayMode !== 'off'" class="slider-with-value">
      <input type="range" min="0" max="1" step="0.01" v-model="overlayOpacity" @input="updateOverlayOpacity"
        class="transparency-slider" />
      <span class="opacity-value">{{ Math.round(overlayOpacity * 100) }}%</span>
    </div>
  </div>

  <!-- Debug Panel -->
  <DebugPanel />


</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import SceneManager from '@/managers/SceneManager.js';
import ControlsManager from '@/managers/ControlsManager';
import GridManager from '@/managers/GridManager';
import CelestialManager from '@/managers/CelestialManager';
import UIManager from '@/managers/UIManager';
import GroundManager from '@/managers/GroundManager';
import LabelManager from '@/managers/LabelManager';
import GraphicsDebugManager from '@/managers/GraphicsDebugManager';
import TimeSelectorV2 from '@/components/TimeSelectorV2.vue';
import SideMenu from '@/components/SideMenu.vue';
import DebugPanel from '@/components/DebugPanel.vue';
import HealpixManager from '@/managers/HealpixManager';
import OverlayManager from '@/managers/OverlayManager';
import { getWorldUp, equatorial_to_cartesian, cartesian_to_equatorial } from '@/utils/algos';




export default {
  name: 'Scene',
  components: {
    TimeSelectorV2,
    SideMenu,
    DebugPanel,
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
    const overlayMode = ref('original');
    const isTracking = ref(false);
    const terrainOn = ref(true);

    let sceneManager = null;
    let updateStarsInterval = null;
    let controlsManager = null;
    let gridManager = null;
    let celestialManager = null;
    let uiManager = null;
    let groundManager = null;
    let healpixManager = null;
    let overlayManager = null;
    let labelManager = null;
    let debugManager = null;

    const debugList = ref([0, 0, 0, 0]);

    const observerLat = ref(59.9343);
    const observerLon = ref(30.3351);
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

      // rotateSky теперь вызывается каждый кадр в анимационном цикле
    };

    const onLocationChanged = (newLocation) => {
      observer.latitude = newLocation.latitude;
      observer.longitude = newLocation.longitude;
      observerLat.value = newLocation.latitude;
      observerLon.value = newLocation.longitude;
      sceneManager.setSkyNorth(observer.longitude, observer.latitude);
    };

    const onTerrainToggle = () => {
      if (groundManager && groundManager.groundMesh) {
        const newVisible = !groundManager.groundMesh.visible;
        groundManager.setVisible(newVisible);
        terrainOn.value = newVisible;
      }
    };

    const setMode = (mode) => {
      overlayMode.value = mode;
      if (overlayManager) {
        overlayManager.setOverlayMode(mode);
        if (mode !== 'off') {
          overlayManager.setOverlaysOpacity(overlayOpacity.value);
        }
      }
    };

    const updateOverlayOpacity = () => {
      if (overlayManager) {
        overlayManager.setOverlaysOpacity(overlayOpacity.value);
      }
    };

    const onToggleTracking = () => {

      isTracking.value = !isTracking.value;
      
      if (isTracking.value) {
        const coordinates = controlsManager.getCurrentCameraViewCoordinates();
        
        if (coordinates) {
          const currentViewTarget = { ra: coordinates.ra_deg, dec: coordinates.dec_deg };
          controlsManager.lockTarget(currentViewTarget);
        }
      } else {
        controlsManager.unlockTarget();
      }
    };

    onMounted(() => {
      sceneManager = new SceneManager(threeContainer.value);
      sceneManager.rotateSky(observer.longitude, observer.latitude, new Date());
      
      gridManager = new GridManager(sceneManager.skyGroup);
      controlsManager = new ControlsManager(
        sceneManager.camera,
        sceneManager.renderer.domElement,
        sceneManager.skyGroup
      );

      labelManager = new LabelManager(sceneManager.skyGroup, sceneManager);

      // Добавляем обработчик кликов по лейблам
      sceneManager.renderer.domElement.addEventListener('click', (event) => {
        const clickedLabels = labelManager.checkLabelClick(
          event,
          sceneManager.camera,
          sceneManager.renderer.domElement
        );

        console.log(clickedLabels);
        return;
        
        if (clickedLabels.length > 0) {
          console.log('🏷️ Clicked labels:');
          clickedLabels.forEach((label, index) => {
            if (label.type === 'planet') {
              console.log(`  ${index + 1}. 🪐 Planet: ${label.name}`);
            } else if (label.type === 'star') {
              const starName = label.sprite.userData?.name || 'Unknown';
              const magnitude = label.sprite.userData?.magnitude;
              const sourceId = label.sprite.userData?.source_id;
              console.log(`  ${index + 1}. ⭐ Star: ${starName}${magnitude ? ` (mag: ${magnitude.toFixed(2)})` : ''}${sourceId ? ` [${sourceId}]` : ''}`);
            }
          });
        }
      });

      //debugManager = new GraphicsDebugManager(sceneManager.skyGroup);

      // Инициализируем CelestialManager с LabelManager
      celestialManager = new CelestialManager(sceneManager.camera, sceneManager.skyGroup, labelManager);
      celestialManager.updatePositions(new Date(), observer);
      
      // Инициализируем UIManager
      uiManager = new UIManager(hudRef.value);
      healpixManager = new HealpixManager(sceneManager.skyGroup, labelManager);
      groundManager = new GroundManager(sceneManager.scene);
      overlayManager = new OverlayManager(sceneManager.skyGroup, controlsManager);

      if (props.taskId) {
        groundManager.setVisible(false);
        overlayManager.overlay(props.taskId);
      }

      healpixManager.update();


      sceneManager.startAnimationLoop((deltaTime, elapsedTime, scene, camera) => {

        if (timeSelectorRef.value) {
          const smoothTime = timeSelectorRef.value.getSmoothTime(deltaTime);
          
          const trackingInfo = controlsManager.getTrackingInfo();
          const shouldFreezeSky = trackingInfo.mode !== null && controlsManager.userIsInteracting;
          
          if (!shouldFreezeSky) {
            sceneManager.rotateSky(observer.longitude, observer.latitude, smoothTime);
          }
        }
        
        // Чистое обновление: ControlsManager сам управляет трекингом
        controlsManager.update();
        celestialManager.update(sceneManager.getUp());

        // Получаем координаты направления взгляда камеры
        const coordinates = controlsManager.getCurrentCameraViewCoordinates();
        
        if (coordinates) {
          const trackingInfo = controlsManager.getTrackingInfo();
          let trackingText = '';
          
          if (trackingInfo.mode === 'celestial') {
            const offsetText = trackingInfo.offset
              ? `\noffset: RA${trackingInfo.offset.ra >= 0 ? '+' : ''}${trackingInfo.offset.ra.toFixed(5)}° DEC${trackingInfo.offset.dec >= 0 ? '+' : ''}${trackingInfo.offset.dec.toFixed(5)}°`
              : '';
            const frozenText = controlsManager.userIsInteracting ? ' [stop rotation]' : '';
            trackingText = `\ntracking: ${trackingInfo.celestialObject}${offsetText}${frozenText}`;
          } else if (trackingInfo.mode === 'fixed') {
            const frozenText = controlsManager.userIsInteracting ? ' [stop rotation]' : '';
            trackingText = `\ntracking: fixed position ${frozenText}`;
          }
            
          const text =
            `tiles_loaded: ` + healpixManager.tileManager.currentTiles.length + `\n` +
            `fov: ${camera.fov.toFixed(2)}` + `\n` +
            `camera_ra: ${coordinates.ra_deg.toFixed(2)}°` + `\n` +
            `camera_dec: ${coordinates.dec_deg.toFixed(2)}°` + trackingText;
          uiManager.updateHUD(text);
        }
        
        healpixManager.setOrder(sceneManager.camera);
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
        track: (objectName) => {
          if (!controlsManager || !celestialManager) {
            console.error('❌ Managers not initialized');
            return;
          }
          controlsManager.trackCelestialObject(celestialManager, objectName);
          isTracking.value = true;
          console.log('✅ Tracking:', objectName);
        },
        untrack: () => {
          if (!controlsManager) {
            console.error('❌ ControlsManager not initialized');
            return;
          }
          controlsManager.unlockTarget();
          isTracking.value = false;
          console.log('✅ Tracking disabled');
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
      overlayMode,
      setMode,
      observerLat,
      observerLon,
      onTimeSelectorReady,
      isTracking,
      terrainOn,
      onToggleTracking,
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
  top: 60px;
  left: 10px;
  color: white;
  z-index: 99;
  background: rgba(0, 0, 0, 0.4);
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.85em;
  pointer-events: none;
}

#time-selector-wrapper {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
}

.button-row {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.overlay-controls {
  background: rgba(28, 28, 36, 0.95);
  padding: 12px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.overlay-mode-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.overlay-mode-toggle button {
  flex: 1;
  padding: 4px 8px;
  font-size: 0.8em;
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.overlay-mode-toggle button.active {
  background: rgba(66, 185, 131, 0.3);
  color: #fff;
  border-color: #42b983;
}

.overlay-mode-toggle button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.2);
  color: #ccc;
}

.slider-label {
  color: #fff;
  font-size: 0.9em;
  margin-bottom: 8px;
  font-weight: 500;
}

.slider-with-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transparency-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

.transparency-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.transparency-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.opacity-value {
  color: #fff;
  min-width: 40px;
  font-size: 0.9em;
  font-weight: 500;
}
</style>
