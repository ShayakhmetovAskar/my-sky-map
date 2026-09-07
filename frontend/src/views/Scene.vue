<template>
  <div class="three-container" ref="threeContainer"></div>

  <div v-if="!embedded" id="hud">
    <pre id="fovValue" ref="hudRef">HUD ...</pre>
  </div>

  <!-- Side Menu -->
  <SideMenu v-if="!embedded"
    :latitude="observerLat"
    :longitude="observerLon"
    :terrain="terrainOn"
    :tracking="isTracking"
    @location-changed="onLocationChanged"
    @toggle-terrain="onTerrainToggle"
    @toggle-tracking="onToggleTracking"
    @ra-format-changed="onRaFormatChanged"
    @cursor-tooltip-changed="(v) => { cursorTooltipEnabled = v }"
    @coord-system-changed="(v) => { coordSystem = v }"
    @toggle-constellations="onConstellationsToggle"
    @constellation-lang-changed="onConstellationLangChanged"
    @max-fps-changed="onMaxFpsChanged"
  />

  <!-- My Sky: the signed-in user's solved images (GET /me/sky) -->
  <MySkyPanel v-if="!embedded && mySkyEnabled"
    ref="mySkyPanelRef"
    :images="mySkyImages"
    :selected-id="mySkySelectedId"
    :layer-on="mySkyLayerOn"
    :outlines-on="mySkyOutlinesOn"
    :compare-on="mySkyCompareOn"
    :labels-on="mySkyLabelsOn"
    :stars-on="mySkyStarsOn"
    :hover-id="mySkyHoverId"
    :hidden-ids="mySkyHiddenIds"
    :opacity="mySkyOpacity"
    @fly="onMySkyFly"
    @hover="onMySkyHover"
    @select="onMySkySelect"
    @toggle-layer="onMySkyToggle"
    @toggle-outlines="onMySkyOutlines"
    @toggle-compare="onMySkyCompare"
    @toggle-labels="onMySkyLabels"
    @toggle-stars="onMySkyStars"
    @toggle-visible="onMySkyToggleVisible"
    @opacity="onMySkyOpacity"
    @collection-filter="onMySkyCollectionFilter"
    @reload-images="onMySkyReloadRequest"
  />
  <!-- My Sky outline labels (DOM, projected each frame) -->
  <div ref="mySkyLabelsRef" class="mysky-labels"></div>
  <!-- My Sky compare slider line -->
  <div v-if="mySkyEnabled && mySkyCompareOn" class="compare-line" :style="{ left: mySkyCompareX + 'px' }" @pointerdown="onCompareDown" @wheel.prevent="onCompareWheel">
    <div class="compare-handle"><span>my photo</span><span class="compare-sep">⇔</span><span>DSS</span></div>
  </div>

  <!-- Bottom Bar: time + ground + tracking -->
  <TimeSelectorV2 v-if="!embedded" ref="timeSelectorRef"
    :ground="terrainOn"
    :tracking="isTracking"
    :grid="gridOn"
    :constellations="constellationsOn"
    @time-changed="onTimeChanged"
    @ready="onTimeSelectorReady"
    @toggle-terrain="onTerrainToggle"
    @toggle-tracking="onToggleTracking"
    @toggle-grid="onGridToggle"
    @toggle-constellations="onConstellationsToggle"
  />

  <!-- Overlay Controls (when viewing solved image) -->
  <div v-if="taskId" class="overlay-controls" :class="{ 'overlay-embedded': embedded }">
    <div class="overlay-mode-toggle">
      <button :class="{ active: overlayMode === 'original' }" @click="setMode('original')">Original</button>
      <button :class="{ active: overlayMode === 'annotated' }" @click="setMode('annotated')">Annotated</button>
      <button :class="{ active: overlayMode === 'off' }" @click="setMode('off')">Off</button>
    </div>
    <div class="slider-with-value" :class="{ disabled: overlayMode === 'off' }">
      <input type="range" min="0" max="1" step="0.01" v-model="overlayOpacity" @input="updateOverlayOpacity"
        class="transparency-slider" :disabled="overlayMode === 'off'" />
      <span class="opacity-value">{{ Math.round(overlayOpacity * 100) }}%</span>
    </div>
  </div>

  <!-- Grid Labels -->
  <div v-if="!embedded" ref="gridLabelsRef" class="grid-labels"></div>

  <!-- Cursor Tooltip -->
  <div v-if="cursorTooltipVisible" class="cursor-tooltip" :style="{ left: cursorX + 'px', top: cursorY + 'px' }">
    {{ cursorCoords }}
    <div v-if="angDistResult" class="ang-dist">{{ angDistResult }}</div>
  </div>

  <!-- Debug Panel -->
  <DebugPanel v-if="!embedded" />


</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import SceneManager from '@/managers/SceneManager.js';
import ControlsManager from '@/managers/ControlsManager';
import GridManager from '@/managers/GridManager';
import ConstellationManager from '@/managers/ConstellationManager';
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
import FootprintManager from '@/managers/FootprintManager';
import { UserHipsCompositeLoader } from '@/utils/userHipsComposite';
import MySkyPanel from '@/components/MySkyPanel.vue';
import apiClient from '@/utils/apiClient';
import { useAuth } from '@/composables/useAuth';
import { getWorldUp, equatorial_to_cartesian, cartesian_to_equatorial, isPoleOnScreen, equatorialToHorizontal, getZenithRaDecFast, formatDMS, formatHMS, angularDistance } from '@/utils/algos';
import debugSettings from '@/settings/debugSettings';

export default {
  name: 'Scene',
  components: {
    TimeSelectorV2,
    SideMenu,
    DebugPanel,
    MySkyPanel,
  },
  props: {
    taskId: {
      type: [String],
      required: true
    },
    embedded: {
      type: Boolean,
      default: false
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
    const gridOn = ref(true);
    const constellationsOn = ref(localStorage.getItem('constellations') !== 'false');
    const gridLabelsRef = ref(null);
    const raFormat = ref(localStorage.getItem('raFormat') || 'hours');
    const cursorTooltipEnabled = ref(localStorage.getItem('cursorTooltip') !== 'false');
    const coordSystem = ref(localStorage.getItem('coordSystem') || 'equatorial');
    const cursorTooltipVisible = ref(false);
    const cursorX = ref(0);
    const cursorY = ref(0);
    const cursorCoords = ref('');

    const _raycaster = new THREE.Raycaster();
    const _mouse = new THREE.Vector2();
    let _mouseOnCanvas = false;
    let _lastClientX = 0;
    let _lastClientY = 0;

    // Angular distance measurement
    const angDistPoint1 = ref(null); // { raDeg, decDeg }
    const angDistResult = ref('');

    // ── My Sky: the user's own solved images as a layer over the DSS ─────────
    // Data comes from `GET /me/sky`; the panel exists only for a signed-in user.
    const { isAuthenticated, getToken } = useAuth();
    const mySkyLoaded = ref(false);
    const mySkyEnabled = computed(() => isAuthenticated.value && mySkyLoaded.value);
    const mySkyImages = ref([]);
    const mySkySelectedId = ref(null);
    const mySkyLayerOn = ref(true);
    const mySkyOutlinesOn = ref(localStorage.getItem('mySkyOutlines') === '1');
    const mySkyOpacity = ref(1);
    const mySkyPanelRef = ref(null);
    const mySkyLabelsRef = ref(null);
    const mySkyHoverId = ref(null);        // image under the mouse on the sky
    const mySkyCompareOn = ref(false);
    const mySkyLabelsOn = ref(localStorage.getItem('mySkyLabels') !== '0');
    const mySkyHiddenIds = ref(JSON.parse(localStorage.getItem('mySkyHidden') || '[]'));
    const mySkyStarsOn = ref(localStorage.getItem('mySkyStars') !== '0');
    const onMySkyStars = (v) => {
      mySkyStarsOn.value = v;
      localStorage.setItem('mySkyStars', v ? '1' : '0');
      healpixManager?.setStarsVisible(v);
    };
    // The panel's collection dropdown narrows the layer, the outlines and the hit test
    // to one collection; `null` means "all photos" (APO-89, design §6).
    const mySkyCollectionIds = ref(null);
    /** Images that can actually be drawn: tiled (`ready`), in the active collection and
     *  not hidden by the eye. `tiling` ones have no moc/base yet — they only show in the
     *  list, with a spinner. */
    const mySkyVisible = () => mySkyImages.value
        .filter(im => im.status === 'ready'
            && !mySkyHiddenIds.value.includes(im.id)
            && (!mySkyCollectionIds.value || mySkyCollectionIds.value.includes(im.id)));
    const mySkyCompareX = ref(Math.round(320 + (window.innerWidth - 320) / 2));
    let footprintManager = null;
    let userLayer = null; // UserHipsCompositeLoader
    let _compareDragging = false;
    let _lastUrlState = '';
    let _lastUrlWrite = 0;

    let sceneManager = null;
    let updateStarsInterval = null;
    let controlsManager = null;
    let gridManager = null;
    let celestialManager = null;
    let uiManager = null;
    let groundManager = null;
    let healpixManager = null;
    let overlayManager = null;
    let constellationManager = null;
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

    const onGridToggle = () => {
      gridOn.value = !gridOn.value;
      if (gridManager) gridManager.setVisible(gridOn.value);
    };

    const onConstellationsToggle = () => {
      constellationsOn.value = !constellationsOn.value;
      localStorage.setItem('constellations', constellationsOn.value);
      if (constellationManager) constellationManager.setVisible(constellationsOn.value);
    };

    const onConstellationLangChanged = (lang) => {
      if (constellationManager) constellationManager.setLang(lang);
    };

    const onRaFormatChanged = (fmt) => {
      raFormat.value = fmt;
      localStorage.setItem('raFormat', fmt);
    };

    const onMaxFpsChanged = (fps) => {
      if (sceneManager) sceneManager.setMaxFramerate(fps);
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

    // panel → scene
    const onMySkyFly = (img) => {
      if (!controlsManager || !img) return;
      // the target may be below the horizon right now — the ground would hide it
      if (terrainOn.value) onTerrainToggle();
      controlsManager.flyTo(img.ra, img.dec, Math.max(0.05, img.fov * 1.3));
    };
    const onMySkySelect = (img) => {
      mySkySelectedId.value = img ? img.id : null;
      footprintManager?.setSelected(img || null);
    };
    const onMySkyHover = (img) => {
      footprintManager?.setHover(img && img.id !== mySkySelectedId.value ? img : null);
    };
    const applyMySkyOpacity = () => {
      healpixManager?.tileManager?.meshLoader?.setUserOpacity(mySkyLayerOn.value ? mySkyOpacity.value : 0);
    };
    const onMySkyToggle = (v) => { mySkyLayerOn.value = v; applyMySkyOpacity(); };

    /** Image whose footprint contains (ra, dec); the smallest field wins when nested. */
    const mySkyImageAt = (raDeg, decDeg) => mySkyVisible()
      .map(im => ({ im, dist: angularDistance(im.ra, im.dec, raDeg, decDeg) }))
      .filter(x => x.dist < x.im.fov / 2)
      .sort((a, b) => a.im.fov - b.im.fov)[0]?.im || null;

    const applyMySkySplit = () => {
      healpixManager?.tileManager?.meshLoader?.setSplit(mySkyCompareOn.value, mySkyCompareX.value * window.devicePixelRatio);
    };
    const onMySkyCompare = (v) => { mySkyCompareOn.value = v; applyMySkySplit(); };
    const onCompareDown = (e) => { _compareDragging = true; e.preventDefault(); };
    const onCompareMove = (e) => {
      if (!_compareDragging) return;
      mySkyCompareX.value = Math.max(0, Math.min(window.innerWidth, e.clientX));
      applyMySkySplit();
    };
    const onCompareUp = () => { _compareDragging = false; };
    const onCompareWheel = (e) => { sceneManager?.renderer?.domElement?.dispatchEvent(new WheelEvent('wheel', e)); };

    /** ?ra=&dec=&fov= mirrors the view; ?img=<id> flies to an image. Written with replaceState, no navigation. */
    const syncUrlFromCamera = (now) => {
      if (!controlsManager || now - _lastUrlWrite < 400) return;
      const c = controlsManager.getCurrentCameraViewCoordinates();
      if (!c) return;
      const state = `${c.ra_deg.toFixed(4)},${c.dec_deg.toFixed(4)},${controlsManager.currentFov.toFixed(3)}`;
      if (state === _lastUrlState) return;
      _lastUrlState = state; _lastUrlWrite = now;
      const params = new URLSearchParams(window.location.search);
      params.set('ra', c.ra_deg.toFixed(4)); params.set('dec', c.dec_deg.toFixed(4)); params.set('fov', controlsManager.currentFov.toFixed(3));
      params.delete('img');
      history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    };
    const applyMySkyOutlines = () => {
      footprintManager?.setAll(mySkyOutlinesOn.value ? mySkyVisible() : null);
      footprintManager?.setLabels(mySkyLabelsOn.value ? mySkyVisible() : null);
    };
    const applyMySkyHidden = () => {
      if (!userLayer) return;
      userLayer.setEnabled(mySkyVisible().map(im => im.id));
      healpixManager?.tileManager?.meshLoader?.refreshUserLayer();
    };
    const onMySkyToggleVisible = (img, currentlyHidden) => {
      mySkyHiddenIds.value = currentlyHidden
        ? mySkyHiddenIds.value.filter(id => id !== img.id)
        : [...mySkyHiddenIds.value, img.id];
      localStorage.setItem('mySkyHidden', JSON.stringify(mySkyHiddenIds.value));
      if (!currentlyHidden && mySkySelectedId.value === img.id) onMySkySelect(null);
      applyMySkyHidden();
      applyMySkyOutlines();
    };
    const onMySkyLabels = (v) => {
      mySkyLabelsOn.value = v;
      localStorage.setItem('mySkyLabels', v ? '1' : '0');
      applyMySkyOutlines();
    };
    const onMySkyOutlines = (v) => {
      mySkyOutlinesOn.value = v;
      localStorage.setItem('mySkyOutlines', v ? '1' : '0');
      applyMySkyOutlines();
    };
    const onMySkyOpacity = (v) => { mySkyOpacity.value = v; applyMySkyOpacity(); };
    /** The panel picked a collection (`null` = all photos): the sky follows the list. */
    const onMySkyCollectionFilter = (ids) => {
      mySkyCollectionIds.value = ids ? [...ids] : null;
      // a selection left outside the collection would keep its footprint on the sky
      if (mySkySelectedId.value && mySkyCollectionIds.value
          && !mySkyCollectionIds.value.includes(mySkySelectedId.value)) onMySkySelect(null);
      applyMySkyHidden();
      applyMySkyOutlines();
    };
    /** Revoking a share rotates the tile secrets in the background (APO-92), so the
     *  `base`/`thumb` URLs in hand go stale — refetch once the rotation has had time. */
    const MYSKY_ROTATION_GRACE_MS = 10000;
    const onMySkyReloadRequest = () => scheduleMySkyReload(MYSKY_ROTATION_GRACE_MS);

    // ── My Sky data: GET /me/sky ────────────────────────────────────────────
    const MYSKY_TILING_POLL_MS = 15000;  // an image is `tiling` for a minute or two
    const MYSKY_STALE_MS = 30000;        // refetch on tab focus if the list is older than this
    let mySkyTimer = null;
    let mySkyFetchedAt = 0;
    let mySkyInflight = false;

    const scheduleMySkyReload = (delayMs) => {
      clearTimeout(mySkyTimer);
      mySkyTimer = setTimeout(() => { loadMySky(); }, delayMs);
    };

    /** Hand a fresh image list to the layer, the outlines and the panel. */
    const applyMySkyImages = (images) => {
      mySkyImages.value = images;
      // only tiled images can be drawn; `tiling` ones have no moc/base yet
      const drawable = images.filter(im => im.status === 'ready');
      if (userLayer) userLayer.setImages(drawable);
      else userLayer = new UserHipsCompositeLoader(drawable);
      // a selection can disappear on refresh (image deleted elsewhere)
      if (mySkySelectedId.value && !images.some(im => im.id === mySkySelectedId.value)) onMySkySelect(null);
      healpixManager?.setUserLayer(userLayer, userLayer.maxOrder);
      applyMySkyHidden();
      applyMySkyOutlines();
      applyMySkyOpacity();
      applyMySkySplit();
      healpixManager?.setStarsVisible(mySkyStarsOn.value);
    };

    const loadMySky = async () => {
      clearTimeout(mySkyTimer);
      if (props.embedded || mySkyInflight || !getToken()) return;
      mySkyInflight = true;
      try {
        const { data } = await apiClient.get('/me/sky');
        const images = data?.images || [];
        mySkyFetchedAt = Date.now();
        applyMySkyImages(images);
        const first = !mySkyLoaded.value;
        mySkyLoaded.value = true;
        // images still being tiled turn `ready` on their own — poll until they do
        if (images.some(im => im.status === 'tiling')) scheduleMySkyReload(MYSKY_TILING_POLL_MS);
        if (first) applyMySkyDeepLink(images);
      } catch (err) {
        if (err.response?.status !== 401) {
          console.warn('[my sky] /me/sky failed, retrying', err.message);
          scheduleMySkyReload(MYSKY_TILING_POLL_MS);
        }
      } finally {
        mySkyInflight = false;
      }
    };

    /** ?img=<id or id prefix> flies to that image once the list is known. */
    const applyMySkyDeepLink = (images) => {
      const wanted = new URLSearchParams(window.location.search).get('img');
      const target = wanted && images.find(im => im.id === wanted || im.id.startsWith(wanted));
      if (target) setTimeout(() => { onMySkySelect(target); onMySkyFly(target); }, 800);
    };

    /** A photo solved in another tab should show up when this one is looked at again. */
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mySkyLoaded.value
          && Date.now() - mySkyFetchedAt > MYSKY_STALE_MS) loadMySky();
    };

    /** Sign-out (including the 401 interceptor) takes the layer off the sky. */
    watch(isAuthenticated, (authed) => {
      if (authed) { if (!mySkyLoaded.value) loadMySky(); return; }
      clearTimeout(mySkyTimer);
      mySkyLoaded.value = false;
      mySkyImages.value = [];
      mySkySelectedId.value = null;
      mySkyCollectionIds.value = null;   // the panel unmounts with its dropdown
      healpixManager?.setUserLayer(null, 0);
      userLayer?.dispose();
      userLayer = null;
      footprintManager?.setAll(null);
      footprintManager?.setLabels(null);
      footprintManager?.setHover(null);
      footprintManager?.setSelected(null);
    });

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

      // Cursor tooltip — RA/Dec under mouse
      const canvas = sceneManager.renderer.domElement;

      const updateCursorCoords = () => {
        if (!_mouseOnCanvas || !cursorTooltipEnabled.value) {
          cursorTooltipVisible.value = false;
          return;
        }
        _raycaster.setFromCamera(_mouse, sceneManager.camera);
        const dir = _raycaster.ray.direction.clone();
        dir.applyQuaternion(sceneManager.skyGroup.quaternion.clone().invert());

        const [ra, dec] = cartesian_to_equatorial(dir.x, dir.y, dir.z);
        const raDeg = ra * 180 / Math.PI;
        const decDeg = dec * 180 / Math.PI;

        let coordText;
        if (coordSystem.value === 'horizontal') {
          const date = timeSelectorRef.value?.getSmoothTime(0) || new Date();
          const { ra: lstH } = getZenithRaDecFast(date, observer.latitude, observer.longitude);
          const { alt, az } = equatorialToHorizontal(raDeg, decDeg, lstH, observer.latitude);
          coordText = `Az ${formatDMS(az, 0, false)}  Alt ${formatDMS(alt)}`;
        } else {
          const raText = raFormat.value === 'hours' ? formatHMS(raDeg) : formatDMS(raDeg, 0, false);
          coordText = `${raText}  ${formatDMS(decDeg)}`;
        }

        cursorCoords.value = coordText;
        cursorX.value = _lastClientX + 16;
        cursorY.value = _lastClientY + 16;
        cursorTooltipVisible.value = true;

        // photo under the cursor → highlight its row + outline
        if (mySkyEnabled.value) {
          const hit = mySkyImageAt(raDeg, decDeg);
          const id = hit ? hit.id : null;
          if (id !== mySkyHoverId.value) {
            mySkyHoverId.value = id;
            footprintManager?.setHover(hit && hit.id !== mySkySelectedId.value ? hit : null);
          }
        }
      };

      let _downX = 0, _downY = 0;
      canvas.addEventListener('mousedown', (e) => { _downX = e.clientX; _downY = e.clientY; });

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        _lastClientX = e.clientX;
        _lastClientY = e.clientY;
        _mouseOnCanvas = true;
        updateCursorCoords();
      });

      canvas.addEventListener('mouseleave', () => {
        _mouseOnCanvas = false;
        cursorTooltipVisible.value = false;
      });

      // Angular distance: shift+click two points
      canvas.addEventListener('click', (e) => {
        if (!e.shiftKey) {
          angDistPoint1.value = null;
          angDistResult.value = '';
          // a plain click (no drag) on a photo selects it in the panel
          if (mySkyEnabled.value && Math.hypot(e.clientX - _downX, e.clientY - _downY) < 4) {
            _raycaster.setFromCamera(_mouse, sceneManager.camera);
            const d = _raycaster.ray.direction.clone().applyQuaternion(sceneManager.skyGroup.quaternion.clone().invert());
            const [cra, cdec] = cartesian_to_equatorial(d.x, d.y, d.z);
            const raDeg = cra * 180 / Math.PI, decDeg = cdec * 180 / Math.PI;
            const hit = mySkyImageAt(raDeg, decDeg);
            if (hit && hit.id === mySkySelectedId.value) onMySkyFly(hit); // second click flies
            else onMySkySelect(hit);
          }
          return;
        }

        _raycaster.setFromCamera(_mouse, sceneManager.camera);
        const dir = _raycaster.ray.direction.clone();
        dir.applyQuaternion(sceneManager.skyGroup.quaternion.clone().invert());
        const [ra, dec] = cartesian_to_equatorial(dir.x, dir.y, dir.z);
        const raDeg = ra * 180 / Math.PI;
        const decDeg = dec * 180 / Math.PI;

        if (!angDistPoint1.value) {
          angDistPoint1.value = { raDeg, decDeg };
          angDistResult.value = 'Shift+click second point...';
        } else {
          const dist = angularDistance(angDistPoint1.value.raDeg, angDistPoint1.value.decDeg, raDeg, decDeg);
          angDistResult.value = `Distance: ${formatDMS(dist, 1, false)}`;
          angDistPoint1.value = null;
        }
      });

      //debugManager = new GraphicsDebugManager(sceneManager.skyGroup);

      // Инициализируем CelestialManager с LabelManager
      celestialManager = new CelestialManager(sceneManager.camera, sceneManager.skyGroup, labelManager);
      celestialManager.updatePositions(new Date(), observer);
      
      // Инициализируем UIManager
      uiManager = new UIManager(hudRef.value);
      healpixManager = new HealpixManager(sceneManager.skyGroup, labelManager);

      // My Sky image outlines on the sky
      footprintManager = new FootprintManager(sceneManager.skyGroup);
      footprintManager.setLabelContainer(mySkyLabelsRef.value, (img) => { onMySkySelect(img); onMySkyFly(img); }, sceneManager.renderer.domElement);
      window.addEventListener('pointermove', onCompareMove);
      window.addEventListener('pointerup', onCompareUp);

      // deep link: ?ra=&dec=&fov=
      const q = new URLSearchParams(window.location.search);
      if (q.has('ra') && q.has('dec') && q.has('fov')) {
        const [ra, dec, fov] = [Number(q.get('ra')), Number(q.get('dec')), Number(q.get('fov'))];
        setTimeout(() => {
          const p = controlsManager._skyDirection(ra, dec);
          controlsManager.camera.position.set(-p.x, -p.y, -p.z);
          controlsManager.setFov(fov);
          groundManager.setVisible(false);
        }, 1500);
      }
      document.addEventListener('visibilitychange', onVisibilityChange);
      loadMySky();

      groundManager = new GroundManager(sceneManager.scene);
      overlayManager = new OverlayManager(sceneManager.skyGroup, controlsManager);

      if (props.taskId) {
        groundManager.setVisible(false);
        overlayManager.overlay(props.taskId);
      }

      healpixManager.update();

      constellationManager = new ConstellationManager(sceneManager.skyGroup);
      constellationManager.load().then(() => {
        constellationManager.setVisible(constellationsOn.value);
      });

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
        
        // Grid update (before HUD so debug info is current)
        if (gridManager && coordinates) {
          const poleVisible = isPoleOnScreen(camera, sceneManager.skyGroup, 10);
          gridManager.update(camera.fov, coordinates.ra_deg, coordinates.dec_deg, poleVisible);
          gridManager.updateLabels(camera, sceneManager.skyGroup, gridLabelsRef.value, raFormat.value);
        }

        if (constellationManager) constellationManager.update(camera);

        // Update cursor tooltip (sky may have rotated even if mouse didn't move)
        updateCursorCoords();

        // HUD
        if (coordinates) {
          const lines = [
            `fov: ${camera.fov.toFixed(2)}`,
            `ra: ${coordinates.ra_deg.toFixed(2)}°  dec: ${coordinates.dec_deg.toFixed(2)}°`,
          ];

          // Tracking
          const ti = controlsManager.getTrackingInfo();
          if (ti.mode === 'celestial') {
            const offset = ti.offset
              ? ` RA${ti.offset.ra >= 0 ? '+' : ''}${ti.offset.ra.toFixed(5)}° DEC${ti.offset.dec >= 0 ? '+' : ''}${ti.offset.dec.toFixed(5)}°`
              : '';
            const frozen = controlsManager.userIsInteracting ? ' [frozen]' : '';
            lines.push(`tracking: ${ti.celestialObject}${offset}${frozen}`);
          } else if (ti.mode === 'fixed') {
            const frozen = controlsManager.userIsInteracting ? ' [frozen]' : '';
            lines.push(`tracking: fixed${frozen}`);
          }

          // Debug section (toggle via Debug Panel)
          if (debugSettings.get('showHudDebug')) {
            lines.push(`--- debug ---`);
            lines.push(`tiles: ${healpixManager.tileManager.currentTiles.length}`);

            const gd = gridManager ? gridManager.getDebugInfo() : null;
            if (gd) {
              lines.push(`grid: pole:${gd.poleVisible ? 'Y' : 'N'} cached:${gd.cached}`);
              lines.push(`  mer: ${gd.meridians} (${gd.meridianStep}°) par: ${gd.parallels} (${gd.parallelStep}°)`);
              lines.push(`  outer:±${gd.outermostParallel}° extDec:${gd.effectiveExtremeDec}°`);
              lines.push(`  pGap:${gd.parallelGap}% mGap:[${gd.narrowestMGap}%..${gd.widestMGap}%]`);
            }
          }

          uiManager.updateHUD(lines.join('\n'));
        }

        healpixManager.setOrder(sceneManager.camera);
        footprintManager?.update(sceneManager.camera, window.innerWidth, window.innerHeight);
        if (mySkyEnabled.value) syncUrlFromCamera(performance.now());
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
      // opening a task means it has just been solved — its image may be new to the list
      if (mySkyLoaded.value) loadMySky();
    });

    onBeforeUnmount(() => {
      clearTimeout(mySkyTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      footprintManager?.dispose();
      userLayer?.dispose();
      window.removeEventListener('pointermove', onCompareMove);
      window.removeEventListener('pointerup', onCompareUp);
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
      if (constellationManager) {
        constellationManager.dispose();
        constellationManager = null;
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
      gridOn,
      gridLabelsRef,
      onToggleTracking,
      onGridToggle,
      onConstellationsToggle,
      onConstellationLangChanged,
      constellationsOn,
      onRaFormatChanged,
      onMaxFpsChanged,
      cursorTooltipEnabled,
      coordSystem,
      cursorTooltipVisible,
      cursorX,
      cursorY,
      cursorCoords,
      angDistResult,
      // My Sky
      mySkyEnabled,
      mySkyImages,
      mySkySelectedId,
      mySkyLayerOn,
      mySkyOutlinesOn,
      mySkyOpacity,
      mySkyPanelRef,
      mySkyLabelsRef,
      mySkyHoverId,
      mySkyCompareOn,
      mySkyLabelsOn,
      onMySkyLabels,
      mySkyHiddenIds,
      onMySkyToggleVisible,
      mySkyStarsOn,
      onMySkyStars,
      mySkyCompareX,
      onMySkyCompare,
      onCompareDown,
      onCompareWheel,
      onMySkyFly,
      onMySkyHover,
      onMySkySelect,
      onMySkyToggle,
      onMySkyOutlines,
      onMySkyOpacity,
      onMySkyCollectionFilter,
      onMySkyReloadRequest,
    };
  }
};
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  cursor: crosshair;
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
  position: fixed;
  right: 12px;
  bottom: 80px;
  z-index: 100;
  background: rgba(12, 12, 18, 0.92);
  backdrop-filter: blur(16px);
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.overlay-mode-toggle {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.overlay-mode-toggle button {
  padding: 6px 12px;
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

.overlay-embedded {
  position: absolute;
  right: 12px;
  bottom: 12px;
}

.slider-with-value.disabled {
  opacity: 0.35;
}

.grid-labels {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.grid-labels :deep(.grid-label) {
  position: absolute;
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  white-space: nowrap;
  pointer-events: none;
}

.grid-labels :deep(.grid-label-top),
.grid-labels :deep(.grid-label-bottom) {
  transform: translateX(-50%);
}

.grid-labels :deep(.grid-label-right) {
  transform: translateX(-100%) translateY(-50%);
}

.grid-labels :deep(.grid-label-left) {
  transform: translateY(-50%);
}

/* My Sky: sky labels and the compare slider */
.mysky-labels { position: fixed; inset: 0; pointer-events: none; z-index: 90; }
.mysky-labels :deep(.mysky-label),
.mysky-labels .mysky-label {
  position: absolute; left: 0; top: 0;
  pointer-events: auto; cursor: pointer;
  transform-origin: 0 0;
  padding: 2px 7px; border-radius: 6px;
  font: 500 11px system-ui, -apple-system, sans-serif; letter-spacing: 0.02em;
  color: #eafff4; background: rgba(66, 185, 131, 0.28); border: 1px solid rgba(66, 185, 131, 0.7);
  white-space: nowrap; user-select: none;
}
.mysky-labels .mysky-label:hover { background: rgba(66, 185, 131, 0.6); }
.compare-line {
  position: fixed; top: 0; bottom: 0; width: 2px; margin-left: -1px;
  background: rgba(255, 255, 255, 0.85); box-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
  cursor: ew-resize; z-index: 95; touch-action: none;
}
.compare-line::before { content: ''; position: absolute; top: 0; bottom: 0; left: -8px; right: -8px; }
.compare-handle {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; gap: 8px; align-items: center;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(14, 16, 21, 0.9); border: 1px solid rgba(255, 255, 255, 0.25);
  color: #d7dde5; font: 500 11px system-ui, sans-serif; white-space: nowrap; user-select: none;
}
.compare-sep { color: #42b983; font-size: 14px; }

.cursor-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 100;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  background: rgba(0, 0, 0, 0.6);
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.cursor-tooltip .ang-dist {
  color: #4fc3f7;
  margin-top: 2px;
  font-size: 11px;
}
</style>
