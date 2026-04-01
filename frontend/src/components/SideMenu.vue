<template>
  <div>
    <button class="menu-toggle" @click="isOpen = !isOpen" :class="{ open: isOpen }">
      <span class="hamburger-icon" :class="{ cross: isOpen }">
        <span></span><span></span><span></span>
      </span>
    </button>

    <transition name="slide">
      <div v-if="isOpen" class="side-menu" @click.self="isOpen = false">
        <div class="menu-panel">
          <div class="menu-header">
            <h3>Settings</h3>
          </div>

          <!-- Observer Location -->
          <div class="menu-section">
            <div class="section-title">Observer Location</div>
            <div class="coord-inputs">
              <label>
                <span>Lat</span>
                <input type="number" step="0.0001" v-model.number="lat" @change="emitLocation" />
              </label>
              <label>
                <span>Lon</span>
                <input type="number" step="0.0001" v-model.number="lon" @change="emitLocation" />
              </label>
            </div>
            <button class="gps-btn" @click="getGPS" :disabled="gpsLoading">
              {{ gpsLoading ? 'Getting...' : '📍 Use GPS' }}
            </button>
          </div>

          <!-- View Options -->
          <div class="menu-section">
            <div class="section-title">View</div>
            <label class="toggle-row">
              <input type="checkbox" v-model="terrainOn" @change="$emit('toggle-terrain', terrainOn)" />
              <span>Ground</span>
            </label>
            <label class="toggle-row">
              <input type="checkbox" v-model="trackingOn" @change="$emit('toggle-tracking', trackingOn)" />
              <span>Lock tracking</span>
            </label>
            <label class="toggle-row">
              <input type="checkbox" v-model="constellationsOn" @change="onConstellationsToggle" />
              <span>Constellations</span>
            </label>
            <label class="toggle-row">
              <span>Names</span>
              <select v-model="constLang" @change="onConstLangChange" class="ra-format-select">
                <option value="en">English</option>
                <option value="ru">Русские</option>
              </select>
            </label>
            <label class="toggle-row">
              <span>RA format</span>
              <select v-model="raFmt" @change="emit('ra-format-changed', raFmt)" class="ra-format-select">
                <option value="hours">Hours (0h..23h)</option>
                <option value="degrees">Degrees (0°..360°)</option>
              </select>
            </label>
            <label class="toggle-row">
              <input type="checkbox" v-model="tooltipOn" @change="onTooltipToggle" />
              <span>Cursor coordinates</span>
            </label>
            <label class="toggle-row">
              <span>Coordinates</span>
              <select v-model="coordSys" @change="onCoordSysChange" class="ra-format-select">
                <option value="equatorial">Equatorial (RA/Dec)</option>
                <option value="horizontal">Horizontal (Az/Alt)</option>
              </select>
            </label>
          </div>

          <!-- Navigation -->
          <div class="menu-section">
            <div class="section-title">Navigation</div>
            <router-link to="/solve" class="menu-link" @click="isOpen = false">🔭 Solve New</router-link>
            <router-link to="/submissions" class="menu-link" @click="isOpen = false">📋 My Submissions</router-link>
          </div>

          <!-- Auth -->
          <div class="menu-section menu-bottom">
            <template v-if="isAuthenticated">
              <div class="menu-user">{{ user?.name || 'User' }}</div>
              <button class="logout-btn" @click="doLogout">Logout</button>
            </template>
            <template v-else>
              <button class="login-btn" @click="doLogin">Login</button>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { AUTH_CONFIG } from '@/settings/auth'

const props = defineProps({
  latitude: { type: Number, default: 59.9343 },
  longitude: { type: Number, default: 30.3351 },
  terrain: { type: Boolean, default: true },
  tracking: { type: Boolean, default: false },
})

const emit = defineEmits(['location-changed', 'toggle-terrain', 'toggle-tracking', 'ra-format-changed', 'cursor-tooltip-changed', 'coord-system-changed', 'toggle-constellations', 'constellation-lang-changed'])

const constellationsOn = ref(localStorage.getItem('constellations') !== 'false')

const constLang = ref(localStorage.getItem('constellationLang') || 'en')

const onConstellationsToggle = () => {
  localStorage.setItem('constellations', constellationsOn.value)
  emit('toggle-constellations')
}

const onConstLangChange = () => {
  localStorage.setItem('constellationLang', constLang.value)
  emit('constellation-lang-changed', constLang.value)
}

const raFmt = ref(localStorage.getItem('raFormat') || 'hours')
const tooltipOn = ref(localStorage.getItem('cursorTooltip') !== 'false')

const coordSys = ref(localStorage.getItem('coordSystem') || 'equatorial')

const onTooltipToggle = () => {
  localStorage.setItem('cursorTooltip', tooltipOn.value)
  emit('cursor-tooltip-changed', tooltipOn.value)
}

const onCoordSysChange = () => {
  localStorage.setItem('coordSystem', coordSys.value)
  emit('coord-system-changed', coordSys.value)
}

const { isAuthenticated, user, login, logout } = useAuth()

const isOpen = ref(false)
const lat = ref(props.latitude)
const lon = ref(props.longitude)
const terrainOn = ref(props.terrain)
const trackingOn = ref(props.tracking)

watch(() => props.terrain, (v) => terrainOn.value = v)
watch(() => props.tracking, (v) => trackingOn.value = v)
const gpsLoading = ref(false)

function emitLocation() {
  emit('location-changed', { latitude: lat.value, longitude: lon.value })
}

function getGPS() {
  if (!navigator.geolocation) return
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lat.value = parseFloat(pos.coords.latitude.toFixed(4))
      lon.value = parseFloat(pos.coords.longitude.toFixed(4))
      emitLocation()
      gpsLoading.value = false
    },
    () => { gpsLoading.value = false },
    { timeout: 10000 }
  )
}

function doLogin() {
  isOpen.value = false
  login()
}

function doLogout() {
  isOpen.value = false
  logout()
  window.location.href = `${AUTH_CONFIG.zitadelUrl}/oidc/v1/end_session?post_logout_redirect_uri=${encodeURIComponent(window.location.origin + '/')}`
}
</script>

<style scoped>
.menu-toggle {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1002;
  background: rgba(28, 28, 36, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: left 0.3s ease, background 0.15s;
}

.menu-toggle.open {
  left: 248px;
  background: rgba(28, 28, 36, 0.95);
}

.menu-toggle:hover {
  background: rgba(28, 28, 36, 0.95);
}

/* Hamburger → Cross animation */
.hamburger-icon {
  width: 18px;
  height: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background: #fff;
  border-radius: 1px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger-icon.cross span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.hamburger-icon.cross span:nth-child(2) {
  opacity: 0;
}

.hamburger-icon.cross span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
}

.menu-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background: rgba(18, 18, 24, 0.98);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-header h3 {
  color: #fff;
  margin: 0;
  font-size: 1.1em;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover { color: #fff; }

.menu-section {
  margin-bottom: 20px;
}

.section-title {
  color: #888;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.coord-inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.coord-inputs label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coord-inputs span {
  color: #aaa;
  font-size: 0.8em;
}

.coord-inputs input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.85em;
  width: 100%;
  box-sizing: border-box;
}

.gps-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ccc;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
}

.gps-btn:hover { background: rgba(255, 255, 255, 0.15); }

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 0.85em;
  padding: 6px 0;
  cursor: pointer;
}

.toggle-row input { accent-color: #42b983; }

.ra-format-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: #ccc;
  font-size: 0.85em;
  padding: 2px 4px;
  margin-left: auto;
}

.menu-link {
  display: block;
  color: #ccc;
  text-decoration: none;
  padding: 8px 0;
  font-size: 0.9em;
  transition: color 0.15s;
}

.menu-link:hover { color: #42b983; }

.menu-bottom {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-user {
  color: #aaa;
  font-size: 0.85em;
  margin-bottom: 8px;
}

.logout-btn, .login-btn {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #ccc;
}

.logout-btn:hover { background: rgba(244, 67, 54, 0.15); color: #f44336; border-color: #f44336; }
.login-btn:hover { background: rgba(66, 185, 131, 0.15); color: #42b983; border-color: #42b983; }

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: opacity 0.2s;
}
.slide-enter-active .menu-panel, .slide-leave-active .menu-panel {
  transition: transform 0.25s ease;
}
.slide-enter-from { opacity: 0; }
.slide-enter-from .menu-panel { transform: translateX(-100%); }
.slide-leave-to { opacity: 0; }
.slide-leave-to .menu-panel { transform: translateX(-100%); }
</style>
