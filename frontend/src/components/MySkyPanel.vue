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
          <span class="dock-count">{{ listImages.length }} images · {{ coverageText }}</span>
        </div>
        <button class="dock-close" @click="isOpen = false" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      <!-- Collection picker: All / one collection / + New. The choice is the filter for
           the list, the sky layer and the outlines alike (design §6).
           A shared viewer sees one fixed collection, so the whole bar is owner-only. -->
      <div v-if="!readOnly" class="collection-bar">
        <div class="coll-picker">
          <input v-if="editing" ref="editInputRef" class="coll-edit" v-model="editTitle" maxlength="80"
                 :placeholder="editing === 'create' ? 'New collection' : 'Collection name'"
                 @keydown.enter.stop.prevent="commitEdit"
                 @keydown.esc.stop.prevent="cancelEdit"
                 @blur="commitEdit" @click.stop />
          <button v-else class="coll-btn" :class="{ open: collectionMenuOpen }" @click.stop="toggleCollectionMenu">
            <span class="coll-name">{{ activeCollection ? activeCollection.title : 'All photos' }}</span>
            <svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div v-if="collectionMenuOpen" class="menu coll-menu" @click.stop>
            <button class="menu-item" :class="{ checked: !activeId }" @click="selectCollection(null)">
              <span class="tick">{{ activeId ? '' : '✓' }}</span>
              <span class="menu-label">All photos</span>
              <span class="menu-count">{{ images.length }}</span>
            </button>
            <button v-for="c in collections" :key="c.id" class="menu-item" :class="{ checked: c.id === activeId }"
                    @click="selectCollection(c.id)">
              <span class="tick">{{ c.id === activeId ? '✓' : '' }}</span>
              <span class="menu-label">{{ c.title }}</span>
              <span v-if="c.share_token" class="shared-dot" title="Shared by link">●</span>
              <span class="menu-count">{{ c.items.length }}</span>
            </button>
            <div class="menu-sep"></div>
            <button class="menu-item accent" :disabled="collections.length >= MAX_COLLECTIONS" @click="startCreate()">
              <span class="tick">+</span>
              <span class="menu-label">New collection</span>
            </button>
          </div>
        </div>

        <div v-if="activeCollection && !editing" class="coll-actions">
          <button class="coll-action" title="Rename collection" @click.stop="startRename">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          </button>
          <button class="coll-action" title="Add images to this collection" @click.stop="openAddImages">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="coll-action share" :class="{ on: !!activeCollection.share_token }" title="Share this collection" @click.stop="shareOpen = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>{{ activeCollection.share_token ? 'Shared' : 'Share' }}</span>
          </button>
          <button class="coll-action danger" title="Delete collection" @click.stop="removeCollection">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>

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

      <ul class="image-list" ref="listRef" @scroll="rowMenu = null">
        <li v-for="(img, i) in listImages" :key="img.id"
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
          <button v-if="!readOnly" class="row-menu-btn" :class="{ active: rowMenu && rowMenu.img.id === img.id }"
                  @click.stop="openRowMenu(img, $event)" title="Collections">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>
          </button>
          <button class="row-eye" :class="{ off: hiddenIds.includes(img.id) }" @click.stop="$emit('toggle-visible', img, hiddenIds.includes(img.id))"
                  :title="hiddenIds.includes(img.id) ? 'Show on the sky' : 'Hide from the sky'">
            <svg v-if="!hiddenIds.includes(img.id)" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
          <span v-if="img.status === 'tiling'" class="row-spinner" title="Building sky tiles…"></span>
        </li>
        <li v-if="listImages.length === 0 && activeCollection" class="empty">
          This collection is empty.<br /><a href="#" @click.prevent="openAddImages">Add images</a>
        </li>
        <li v-else-if="listImages.length === 0" class="empty">
          <template v-if="readOnly">This collection is empty.</template>
          <template v-else>No solved images yet.<br /><router-link to="/solve">Solve your first image</router-link></template>
        </li>
      </ul>

      <!-- "Add images": one checklist over every photo, saved as a single PATCH items -->
      <div v-if="addOpen && activeCollection" class="sheet" @click.stop>
        <header class="sheet-head">
          <span class="sheet-title">Add images to “{{ activeCollection.title }}”</span>
          <button class="dock-close" @click="addOpen = false" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>
        <ul class="sheet-list">
          <li v-for="img in images" :key="img.id" class="sheet-row" :class="{ on: draft.has(img.id) }" @click="toggleDraft(img.id)">
            <input type="checkbox" :checked="draft.has(img.id)" @click.stop="toggleDraft(img.id)" />
            <img v-if="img.thumb" class="sheet-thumb" :src="img.thumb" :alt="img.title" loading="lazy" />
            <div v-else class="sheet-thumb thumb-empty"></div>
            <div class="row-text">
              <div class="row-title">{{ img.title }}</div>
              <div class="row-meta"><span>{{ img.date }}</span></div>
            </div>
          </li>
          <li v-if="images.length === 0" class="empty">No solved images yet.</li>
        </ul>
        <footer class="sheet-foot">
          <span class="sheet-count" :class="{ over: draft.size > MAX_ITEMS }">{{ draft.size }} / {{ MAX_ITEMS }}</span>
          <button class="ghost-btn" @click="addOpen = false">Cancel</button>
          <button class="primary-btn" :disabled="busy || draft.size > MAX_ITEMS" @click="saveDraft">Save</button>
        </footer>
      </div>

      <!-- Non-blocking API errors -->
      <div v-if="error" class="error-toast" role="status" @click="error = ''">{{ error }}</div>

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

  <!-- Row "⋯" menu: fixed, so the scrolling list cannot clip it -->
  <div v-if="rowMenu" class="menu row-menu" :style="{ top: rowMenu.y + 'px', left: rowMenu.x + 'px' }" @click.stop>
    <div class="menu-head">Add to collection</div>
    <button v-for="c in collections" :key="c.id" class="menu-item" :class="{ checked: c.items.includes(rowMenu.img.id) }"
            :disabled="busy" @click="toggleMembership(c, rowMenu.img)">
      <span class="tick">{{ c.items.includes(rowMenu.img.id) ? '✓' : '' }}</span>
      <span class="menu-label">{{ c.title }}</span>
    </button>
    <div v-if="collections.length === 0" class="menu-empty">No collections yet</div>
    <button class="menu-item accent" :disabled="collections.length >= MAX_COLLECTIONS" @click="startCreate(rowMenu.img)">
      <span class="tick">+</span>
      <span class="menu-label">New collection…</span>
    </button>
    <template v-if="activeCollection && activeCollection.items.includes(rowMenu.img.id)">
      <div class="menu-sep"></div>
      <button class="menu-item danger" :disabled="busy" @click="removeFromActive(rowMenu.img)">
        <span class="tick">−</span>
        <span class="menu-label">Remove from “{{ activeCollection.title }}”</span>
      </button>
    </template>
  </div>

  <ShareDialog v-if="shareOpen && activeCollection"
    :collection="activeCollection"
    @close="shareOpen = false"
    @updated="onShareUpdated"
    @error="showMessage" />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import apiClient from '@/utils/apiClient'
import ShareDialog from '@/components/ShareDialog.vue'

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
const emit = defineEmits([
  'fly', 'hover', 'toggle-layer', 'toggle-outlines', 'toggle-labels', 'toggle-stars',
  'toggle-compare', 'toggle-visible', 'opacity', 'select',
  'collection-filter', 'reload-images',
])

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

// ── Collections (GET /me/collections) ──────────────────────────────────────
// Server-side limits, mirrored so the UI can say no before the request does.
const MAX_COLLECTIONS = 50
const MAX_ITEMS = 200
const ACTIVE_KEY = 'mySkyCollection'

const collections = ref([])
const activeId = ref(props.readOnly ? null : localStorage.getItem(ACTIVE_KEY) || null)
const busy = ref(false)
const error = ref('')
let errorTimer = null

const collectionMenuOpen = ref(false)
const rowMenu = ref(null)          // { img, x, y }
const addOpen = ref(false)
const draft = ref(new Set())       // pending membership for the "Add images" sheet
const shareOpen = ref(false)
const editing = ref(null)          // 'create' | 'rename'
const editTitle = ref('')
const editInputRef = ref(null)
let createForImage = null          // "+ New collection…" opened from a row

const activeCollection = computed(() => collections.value.find(c => c.id === activeId.value) || null)

/** What the panel shows: everything, or the active collection in its stored order. */
const listImages = computed(() => {
  const coll = activeCollection.value
  if (!coll) return props.images
  const byId = new Map(props.images.map(im => [im.id, im]))
  return coll.items.map(id => byId.get(id)).filter(Boolean)
})

// The same choice drives the sky layer and the outlines: `null` means "all photos".
const activeItemIds = computed(() => (activeCollection.value ? activeCollection.value.items.slice() : null))
// `.slice()` gives a fresh array on every recomputation, and `collections` is reassigned
// on a rename or a share toggle. Emitting then would rebuild every outline and re-draw
// every cached composite on the sky for an unchanged list — compare before emitting.
watch(activeItemIds, (ids, prev) => {
  if (ids === prev) return
  if (ids && prev && ids.length === prev.length && ids.every((v, i) => v === prev[i])) return
  emit('collection-filter', ids)
}, { immediate: true })
watch(activeId, () => { focusIndex.value = -1; stopTour() })

function showMessage(text) {
  error.value = text
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => { error.value = '' }, 6000)
}

function showError(err, fallback) {
  const detail = err?.response?.data?.detail
  showMessage((typeof detail === 'string' && detail) || fallback)
}

async function loadCollections() {
  try {
    const { data } = await apiClient.get('/me/collections')
    collections.value = Array.isArray(data) ? data : []
    // the stored choice may point at a collection deleted in another tab
    if (activeId.value && !collections.value.some(c => c.id === activeId.value)) selectCollection(null)
  } catch (err) {
    if (err.response?.status !== 401) showError(err, 'Could not load collections')
  }
}

function selectCollection(id) {
  activeId.value = id || null
  if (!props.readOnly) {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  }
  closeMenus()
}

function toggleCollectionMenu() {
  const next = !collectionMenuOpen.value
  closeMenus()
  collectionMenuOpen.value = next
}

function closeMenus() {
  collectionMenuOpen.value = false
  rowMenu.value = null
}

/** Items are stored newest-first, the order `/me/sky` already uses. */
function orderedItems(ids) {
  const set = ids instanceof Set ? ids : new Set(ids)
  const known = props.images.filter(im => set.has(im.id)).map(im => im.id)
  const seen = new Set(known)
  // anything /me/sky does not list (a failed or just-deleted image) keeps its place at the end
  return [...known, ...[...set].filter(id => !seen.has(id))]
}

async function patchCollection(id, body, fallback) {
  busy.value = true
  try {
    const { data } = await apiClient.patch(`/me/collections/${id}`, body)
    collections.value = collections.value.map(c => (c.id === id ? data : c))
    return data
  } catch (err) {
    showError(err, fallback)
    // 404 = the collection (or an image in it) is gone in another tab — resync
    if (err.response?.status === 404) loadCollections()
    return null
  } finally {
    busy.value = false
  }
}

async function createCollection(title) {
  busy.value = true
  try {
    const { data } = await apiClient.post('/me/collections', { title })
    collections.value = [...collections.value, data]
    return data
  } catch (err) {
    showError(err, 'Could not create the collection')
    return null
  } finally {
    busy.value = false
  }
}

async function removeCollection() {
  const coll = activeCollection.value
  if (!coll) return
  closeMenus()
  if (!window.confirm(`Delete the collection “${coll.title}”? The photos themselves stay in My Sky.`)) return
  busy.value = true
  try {
    await apiClient.delete(`/me/collections/${coll.id}`)
    collections.value = collections.value.filter(c => c.id !== coll.id)
    selectCollection(null)
  } catch (err) {
    showError(err, 'Could not delete the collection')
  } finally {
    busy.value = false
  }
}

async function toggleMembership(coll, img) {
  const set = new Set(coll.items)
  if (set.has(img.id)) set.delete(img.id)
  else if (set.size >= MAX_ITEMS) { showMessage(`A collection holds at most ${MAX_ITEMS} images.`); return }
  else set.add(img.id)
  await patchCollection(coll.id, { items: orderedItems(set) }, 'Could not update the collection')
}

/** "Remove from <collection>": the row leaves the list, so the menu goes with it. */
async function removeFromActive(img) {
  const coll = activeCollection.value
  closeMenus()
  if (coll) await toggleMembership(coll, img)
}

// ── Add images sheet ───────────────────────────────────────────────────────
function openAddImages() {
  if (!activeCollection.value) return
  closeMenus()
  draft.value = new Set(activeCollection.value.items)
  addOpen.value = true
}

function toggleDraft(id) {
  const next = new Set(draft.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  draft.value = next
}

async function saveDraft() {
  const coll = activeCollection.value
  if (!coll) return
  const saved = await patchCollection(coll.id, { items: orderedItems(draft.value) }, 'Could not update the collection')
  if (saved) addOpen.value = false
}

// ── Inline rename / create ─────────────────────────────────────────────────
function startRename() {
  if (!activeCollection.value) return
  closeMenus()
  createForImage = null
  editing.value = 'rename'
  editTitle.value = activeCollection.value.title
  nextTick(() => editInputRef.value?.select())
}

function startCreate(img = null) {
  closeMenus()
  createForImage = img
  editing.value = 'create'
  editTitle.value = ''
  nextTick(() => editInputRef.value?.focus())
}

function cancelEdit() {
  editing.value = null
  editTitle.value = ''
  createForImage = null
}

async function commitEdit() {
  if (!editing.value) return           // Esc already cancelled; the blur that follows is a no-op
  const mode = editing.value
  const title = editTitle.value.trim()
  const img = createForImage
  editing.value = null
  editTitle.value = ''
  createForImage = null
  if (!title) return
  if (mode === 'create') {
    const created = await createCollection(title)
    if (!created) return
    if (img) await patchCollection(created.id, { items: [img.id] }, 'Could not update the collection')
    selectCollection(created.id)
  } else if (activeCollection.value && title !== activeCollection.value.title) {
    await patchCollection(activeCollection.value.id, { title }, 'Could not rename the collection')
  }
}

// ── Row menu ───────────────────────────────────────────────────────────────
function openRowMenu(img, event) {
  if (rowMenu.value && rowMenu.value.img.id === img.id) { rowMenu.value = null; return }
  const r = event.currentTarget.getBoundingClientRect()
  const height = Math.min(320, 90 + collections.value.length * 32)
  rowMenu.value = {
    img,
    x: Math.min(r.left, window.innerWidth - 250),
    y: Math.min(r.bottom + 4, Math.max(8, window.innerHeight - height)),
  }
  collectionMenuOpen.value = false
}

function onShareUpdated(patch) {
  collections.value = collections.value.map(c => (c.id === patch.id ? { ...c, ...patch } : c))
  // Revoking rotates tile secrets in the background: the `base` URLs in hand go stale.
  if (patch.revoked) emit('reload-images')
}

const onDocClick = () => closeMenus()
onMounted(() => {
  document.addEventListener('click', onDocClick)
  // A shared viewer has no session: /me/collections would 401 and trip the
  // logout interceptor in apiClient, so the owner's collections stay unloaded.
  if (!props.readOnly) loadCollections()
})

// ── List behaviour ─────────────────────────────────────────────────────────
// rough share of the sky covered: sum of (fov^2) over 41253 sq. deg
const coverageText = computed(() => {
  const sq = listImages.value.reduce((s, im) => s + im.fov * im.fov / 2, 0)
  const pct = (sq / 41253) * 100
  return pct < 0.01 ? '<0.01% of sky' : `${pct.toFixed(2)}% of sky`
})

function fly(img, i) {
  focusIndex.value = i
  emit('select', img)
  emit('fly', img)
}

function onKeydown(e) {
  // let the inline title field and the checklist have their own keys
  if (e.target !== e.currentTarget && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return
  const list = listImages.value
  if (!list.length) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const n = list.length
    focusIndex.value = ((focusIndex.value + (e.key === 'ArrowDown' ? 1 : -1)) % n + n) % n
    const img = list[focusIndex.value]
    emit('hover', img)
    listRef.value?.children[focusIndex.value]?.scrollIntoView({ block: 'nearest' })
  } else if (e.key === 'Enter' && focusIndex.value >= 0) {
    fly(list[focusIndex.value], focusIndex.value)
  } else if (e.key === 'Escape') {
    stopTour()
  }
}

function toggleTour() {
  touring.value ? stopTour() : startTour()
}

function startTour() {
  const list = listImages.value
  if (!list.length) return
  touring.value = true
  let i = Math.max(0, focusIndex.value)
  const step = () => {
    if (!touring.value) return
    const current = listImages.value
    if (!current.length) { stopTour(); return }
    i = i % current.length
    fly(current[i], i)
    listRef.value?.children[i]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    i = (i + 1) % current.length
    tourTimer = setTimeout(step, 4000)
  }
  step()
}

function stopTour() {
  touring.value = false
  if (tourTimer) { clearTimeout(tourTimer); tourTimer = null }
}

defineExpose({ startTour, stopTour })
onBeforeUnmount(() => {
  stopTour()
  clearTimeout(errorTimer)
  document.removeEventListener('click', onDocClick)
})
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

/* ── collection bar ─────────────────────────────────────────────────────── */
.collection-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.coll-picker { position: relative; flex: 1; min-width: 0; }
.coll-btn {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 6px 8px; border-radius: 7px; cursor: pointer; font-size: 0.84rem;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04); color: #d7dde5;
}
.coll-btn:hover, .coll-btn.open { background: rgba(255, 255, 255, 0.09); }
.coll-name { flex: 1; min-width: 0; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chev { flex-shrink: 0; color: #8a93a0; }
.coll-edit {
  width: 100%; padding: 6px 8px; border-radius: 7px; font-size: 0.84rem; color: #fff;
  border: 1px solid rgba(66, 185, 131, 0.6); background: rgba(0, 0, 0, 0.35); outline: none;
}
.coll-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.coll-action {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 6px; border-radius: 6px; cursor: pointer; font-size: 0.74rem;
  border: 1px solid transparent; background: none; color: #8a93a0;
}
.coll-action:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.coll-action.share { border-color: rgba(255, 255, 255, 0.12); }
.coll-action.share.on { color: #42b983; border-color: rgba(66, 185, 131, 0.5); }
.coll-action.danger:hover { color: #e2777a; }

/* ── popup menus ────────────────────────────────────────────────────────── */
.menu {
  background: #191c23;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  padding: 4px;
  font-size: 0.82rem;
  max-height: 320px;
  overflow-y: auto;
}
.coll-menu { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 1002; }
.row-menu { position: fixed; width: 240px; z-index: 1003; font-family: system-ui, -apple-system, sans-serif; color: #d7dde5; }
.menu-item {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: 6px 8px; border-radius: 6px; border: none; background: none; color: #d7dde5;
  cursor: pointer; text-align: left; font-size: 0.82rem;
}
.menu-item:hover:not(:disabled) { background: rgba(255, 255, 255, 0.08); }
.menu-item:disabled { opacity: 0.4; cursor: default; }
.menu-item.checked { color: #fff; }
.menu-item.accent { color: #42b983; }
.menu-item.danger { color: #e2777a; }
.tick { width: 12px; flex-shrink: 0; text-align: center; color: #42b983; }
.menu-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.menu-count { color: #6b7380; font-size: 0.72rem; font-variant-numeric: tabular-nums; }
.shared-dot { color: #42b983; font-size: 0.6rem; }
.menu-head { padding: 6px 8px 4px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7380; }
.menu-empty { padding: 4px 8px 8px; color: #6b7380; font-size: 0.76rem; }
.menu-sep { height: 1px; margin: 4px 2px; background: rgba(255, 255, 255, 0.08); }

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
.row-eye, .row-menu-btn {
  background: none; border: none; padding: 4px; border-radius: 6px; cursor: pointer; flex-shrink: 0;
  color: #4a515b; opacity: 0; transition: opacity 0.12s, color 0.12s;
  display: flex; align-items: center;
}
.image-row:hover .row-eye, .image-row.selected .row-eye, .row-eye.off,
.image-row:hover .row-menu-btn, .image-row.selected .row-menu-btn, .row-menu-btn.active { opacity: 1; }
.row-eye:hover, .row-menu-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.row-eye.off { color: #8a93a0; }
.row-menu-btn.active { color: #42b983; }
.image-row.hidden .thumb, .image-row.hidden .row-text { opacity: 0.4; }
.row-spinner {
  width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgba(66, 185, 131, 0.25); border-top-color: #42b983; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty { padding: 24px 16px; color: #8a93a0; font-size: 0.85rem; text-align: center; line-height: 1.6; }
.empty a { color: #42b983; }

/* ── add-images sheet ───────────────────────────────────────────────────── */
.sheet {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: rgba(14, 16, 21, 0.98);
  z-index: 1002;
}
.sheet-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 12px 10px 12px 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.sheet-title { font-size: 0.86rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sheet-list { list-style: none; margin: 0; padding: 4px 0; overflow-y: auto; flex: 1; }
.sheet-row { display: flex; align-items: center; gap: 10px; padding: 6px 14px; cursor: pointer; }
.sheet-row:hover { background: rgba(255, 255, 255, 0.06); }
.sheet-row.on { background: rgba(66, 185, 131, 0.08); }
.sheet-row input { accent-color: #42b983; flex-shrink: 0; }
.sheet-thumb {
  width: 36px; height: 36px; object-fit: cover; border-radius: 6px; flex-shrink: 0;
  background: #000; border: 1px solid rgba(255, 255, 255, 0.08);
}
.sheet-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.sheet-count { flex: 1; font-size: 0.74rem; color: #8a93a0; font-variant-numeric: tabular-nums; }
.sheet-count.over { color: #e2777a; }
.ghost-btn, .primary-btn {
  padding: 6px 12px; border-radius: 7px; font-size: 0.8rem; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04); color: #cfd6df;
}
.ghost-btn:hover { background: rgba(255, 255, 255, 0.09); }
.primary-btn { border-color: rgba(66, 185, 131, 0.5); background: rgba(66, 185, 131, 0.16); color: #42b983; }
.primary-btn:hover:not(:disabled) { background: rgba(66, 185, 131, 0.26); }
.primary-btn:disabled { opacity: 0.45; cursor: default; }

.error-toast {
  margin: 0 10px 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.76rem;
  line-height: 1.4;
  color: #f0c3c4;
  background: rgba(150, 50, 55, 0.28);
  border: 1px solid rgba(226, 119, 122, 0.4);
  cursor: pointer;
}
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
