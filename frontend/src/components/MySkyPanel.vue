<template>
  <!-- Left dock listing solved images: the owner's own on `/`, a shared collection
       (read-only, no dropdown / ⋯ / Share) on `/s/:token`. -->
  <button class="mysky-toggle" :class="{ open: isOpen }" @click="isOpen = !isOpen" :title="title">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>
    </svg>
  </button>

  <transition name="dock">
    <aside v-if="isOpen" class="mysky-dock" tabindex="0" @keydown="onKeydown">
      <header class="dock-header">
        <div class="dock-title">
          <span class="dock-name" :title="title">{{ title }}</span>
          <span class="dock-count">{{ images.length }} images · {{ coverageText }}</span>
        </div>
        <button class="dock-close" @click="isOpen = false" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      <div class="dock-controls">
        <label class="switch-row">
          <input type="checkbox" :checked="layerOn" @change="$emit('toggle-layer', $event.target.checked)" />
          <span>Show my photos on the sky</span>
        </label>
        <label class="switch-row">
          <input type="checkbox" :checked="outlinesOn" @change="$emit('toggle-outlines', $event.target.checked)" />
          <span>Outline all images</span>
        </label>
        <label class="switch-row">
          <input type="checkbox" :checked="labelsOn" @change="$emit('toggle-labels', $event.target.checked)" />
          <span>Labels on the sky</span>
        </label>
        <label class="switch-row">
          <input type="checkbox" :checked="starsOn" @change="$emit('toggle-stars', $event.target.checked)" />
          <span>Catalog stars</span>
        </label>
        <label class="switch-row">
          <input type="checkbox" :checked="compareOn" @change="$emit('toggle-compare', $event.target.checked)" />
          <span>Compare with DSS <span class="hint">(drag the line)</span></span>
        </label>
        <label class="slider-row" :class="{ disabled: !layerOn }">
          <span>Opacity</span>
          <input type="range" min="0" max="100" :value="Math.round(opacity * 100)" :disabled="!layerOn"
                 @input="$emit('opacity', Number($event.target.value) / 100)" />
          <span class="slider-value">{{ Math.round(opacity * 100) }}%</span>
        </label>
        <button class="tour-btn" :class="{ active: touring }" @click="toggleTour">
          <svg v-if="!touring" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          {{ touring ? 'Stop tour' : 'Tour' }}
        </button>
      </div>

      <ul class="image-list" ref="listRef">
        <li v-for="(img, i) in images" :key="img.id"
            class="image-row"
            :class="{ selected: img.id === selectedId, focused: i === focusIndex, hovered: img.id === hoverId, hidden: hiddenIds.includes(img.id) }"
            @click="fly(img, i)"
            @mouseenter="$emit('hover', img)"
            @mouseleave="$emit('hover', null)">
          <!-- `thumb` is a public URL from the API; images still being tiled have none yet -->
          <img v-if="img.thumb" class="thumb" :src="img.thumb" :alt="img.title" loading="lazy" />
          <div v-else class="thumb thumb-empty" :title="img.title"></div>
          <div class="row-text">
            <div class="row-title">{{ img.title }}</div>
            <div class="row-meta">
              <span>{{ img.date }}</span>
              <span class="dot">·</span>
              <span>{{ img.fov.toFixed(2) }}°</span>
              <span class="dot">·</span>
              <span>{{ img.pixscale.toFixed(1) }}"/px</span>
            </div>
          </div>
          <button class="row-eye" :class="{ off: hiddenIds.includes(img.id) }" @click.stop="$emit('toggle-visible', img, hiddenIds.includes(img.id))"
                  :title="hiddenIds.includes(img.id) ? 'Show on the sky' : 'Hide from the sky'">
            <svg v-if="!hiddenIds.includes(img.id)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
          <span v-if="img.status === 'tiling'" class="row-spinner" title="Building sky tiles…"></span>
        </li>
        <li v-if="images.length === 0" class="empty">
          <template v-if="readOnly">This collection is empty.</template>
          <template v-else>No solved images yet.<br /><router-link to="/solve">Solve your first image</router-link></template>
        </li>
      </ul>

      <!-- Viewer call to action: sign-up path for a stranger, a way home for a user -->
      <div v-if="readOnly" class="dock-cta">
        <router-link v-if="signedIn" to="/" class="cta-btn">Open My Sky</router-link>
        <router-link v-else to="/solve" class="cta-btn">Solve your own photos →</router-link>
      </div>

      <footer class="dock-footer">
        <span>↑↓ browse · Enter fly · hover = outline</span>
        <a v-if="readOnly" class="report-link" :href="reportHref" rel="noopener noreferrer">Report</a>
      </footer>
    </aside>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
  /** Header text: "My Sky" for the owner, the collection title for a viewer. */
  title: { type: String, default: 'My Sky' },
  /** Shared viewer: nothing here may edit the collection or write the owner's storage. */
  readOnly: { type: Boolean, default: false },
  /** Whether the person looking has an account — decides which CTA to show. */
  signedIn: { type: Boolean, default: false },
  selectedId: { type: String, default: null },
  layerOn: { type: Boolean, default: true },
  outlinesOn: { type: Boolean, default: false },
  compareOn: { type: Boolean, default: false },
  labelsOn: { type: Boolean, default: true },
  starsOn: { type: Boolean, default: true },
  hoverId: { type: String, default: null },
  hiddenIds: { type: Array, default: () => [] },
  opacity: { type: Number, default: 1 },
})
const emit = defineEmits(['fly', 'hover', 'toggle-layer', 'toggle-outlines', 'toggle-labels', 'toggle-stars', 'toggle-compare', 'toggle-visible', 'opacity', 'select'])

// A viewer's dock state is their own; it must not overwrite the owner's key.
const DOCK_KEY = props.readOnly ? 'sharedSkyDockOpen' : 'mySkyDockOpen'
const isOpen = ref(localStorage.getItem(DOCK_KEY) !== '0')
watch(isOpen, v => localStorage.setItem(DOCK_KEY, v ? '1' : '0'))

// Abuse reports on a shared link go to a mailbox with the link itself attached.
const ABUSE_EMAIL = import.meta.env.VITE_ABUSE_EMAIL || 'abuse@afsh.space'
const reportHref = computed(() =>
  `mailto:${ABUSE_EMAIL}?subject=${encodeURIComponent('Report a shared sky')}`
  + `&body=${encodeURIComponent(`Link: ${window.location.href}\n\nWhat is wrong:\n`)}`)

const listRef = ref(null)
const focusIndex = ref(-1)
const touring = ref(false)
let tourTimer = null

// rough share of the sky covered: sum of (fov^2) over 41253 sq. deg
const coverageText = computed(() => {
  const sq = props.images.reduce((s, im) => s + im.fov * im.fov / 2, 0)
  const pct = (sq / 41253) * 100
  return pct < 0.01 ? '<0.01% of sky' : `${pct.toFixed(2)}% of sky`
})

function fly(img, i) {
  focusIndex.value = i
  emit('select', img)
  emit('fly', img)
}

function onKeydown(e) {
  if (!props.images.length) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const n = props.images.length
    focusIndex.value = ((focusIndex.value + (e.key === 'ArrowDown' ? 1 : -1)) % n + n) % n
    const img = props.images[focusIndex.value]
    emit('hover', img)
    listRef.value?.children[focusIndex.value]?.scrollIntoView({ block: 'nearest' })
  } else if (e.key === 'Enter' && focusIndex.value >= 0) {
    fly(props.images[focusIndex.value], focusIndex.value)
  } else if (e.key === 'Escape') {
    stopTour()
  }
}

function toggleTour() {
  touring.value ? stopTour() : startTour()
}

function startTour() {
  if (!props.images.length) return
  touring.value = true
  let i = Math.max(0, focusIndex.value)
  const step = () => {
    if (!touring.value) return
    fly(props.images[i], i)
    listRef.value?.children[i]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    i = (i + 1) % props.images.length
    tourTimer = setTimeout(step, 4000)
  }
  step()
}

function stopTour() {
  touring.value = false
  if (tourTimer) { clearTimeout(tourTimer); tourTimer = null }
}

defineExpose({ startTour, stopTour })
onBeforeUnmount(stopTour)
</script>

<style scoped>
.mysky-toggle {
  position: fixed;
  top: 60px;
  left: 12px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(20, 22, 28, 0.85);
  color: #cfd6df;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  transition: background 0.15s, color 0.15s;
}
.mysky-toggle:hover { background: rgba(40, 44, 54, 0.95); color: #fff; }
.mysky-toggle.open { color: #42b983; border-color: rgba(66, 185, 131, 0.5); }

.mysky-dock {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  display: flex;
  flex-direction: column;
  background: rgba(14, 16, 21, 0.92);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #d7dde5;
  font-family: system-ui, -apple-system, sans-serif;
  z-index: 1000;
  outline: none;
}
.dock-enter-active, .dock-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.dock-enter-from, .dock-leave-to { transform: translateX(-24px); opacity: 0; }

.dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px 64px; /* leave room for the two rail buttons */
  min-height: 108px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.dock-title { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.dock-name {
  font-size: 1.05rem; font-weight: 600; letter-spacing: 0.02em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dock-count { font-size: 0.75rem; color: #8a93a0; }
.dock-close {
  background: none; border: none; color: #8a93a0; cursor: pointer; padding: 6px; border-radius: 6px;
}
.dock-close:hover { color: #fff; background: rgba(255, 255, 255, 0.06); }

.dock-controls {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.82rem;
}
.switch-row { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.switch-row input { accent-color: #42b983; }
.slider-row { display: flex; align-items: center; gap: 8px; color: #aab2bd; }
.slider-row.disabled { opacity: 0.4; }
.slider-row input { flex: 1; accent-color: #42b983; }
.slider-value { width: 36px; text-align: right; font-variant-numeric: tabular-nums; }
.tour-btn {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 6px; font-size: 0.78rem;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04); color: #cfd6df; cursor: pointer;
}
.tour-btn:hover { background: rgba(255, 255, 255, 0.08); }
.tour-btn.active { border-color: rgba(66, 185, 131, 0.6); color: #42b983; }

.image-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  overflow-y: auto;
  flex: 1;
}
.image-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px 7px 14px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.12s;
}
.image-row:hover, .image-row.focused, .image-row.hovered { background: rgba(255, 255, 255, 0.07); }
.hint { color: #6b7380; font-size: 0.75rem; }
.image-row.selected { border-left-color: #42b983; background: rgba(66, 185, 131, 0.08); }
.thumb {
  width: 52px; height: 52px; object-fit: cover; border-radius: 8px; flex-shrink: 0;
  background: #000; border: 1px solid rgba(255, 255, 255, 0.08);
}
.thumb-empty { background: repeating-linear-gradient(45deg, #16181d, #16181d 6px, #1d2027 6px, #1d2027 12px); }
.row-text { flex: 1; min-width: 0; }
.row-title { font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-meta { font-size: 0.72rem; color: #8a93a0; margin-top: 2px; display: flex; gap: 5px; font-variant-numeric: tabular-nums; }
.dot { color: #4a515b; }
.row-eye {
  background: none; border: none; padding: 4px; border-radius: 6px; cursor: pointer; flex-shrink: 0;
  color: #4a515b; opacity: 0; transition: opacity 0.12s, color 0.12s;
}
.image-row:hover .row-eye, .image-row.selected .row-eye, .row-eye.off { opacity: 1; }
.row-eye:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.row-eye.off { color: #8a93a0; }
.image-row.hidden .thumb, .image-row.hidden .row-text { opacity: 0.4; }
.row-spinner {
  width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgba(66, 185, 131, 0.25); border-top-color: #42b983; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty { padding: 24px 16px; color: #8a93a0; font-size: 0.85rem; text-align: center; line-height: 1.6; }
.empty a { color: #42b983; }

.dock-cta {
  padding: 12px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.cta-btn {
  display: block;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid rgba(66, 185, 131, 0.5);
  background: rgba(66, 185, 131, 0.12);
  color: #42b983;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
}
.cta-btn:hover { background: rgba(66, 185, 131, 0.22); color: #eafff4; }

.dock-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 14px;
  font-size: 0.7rem;
  color: #5d6570;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.report-link { color: #5d6570; text-decoration: none; flex-shrink: 0; }
.report-link:hover { color: #8a93a0; text-decoration: underline; }
</style>
