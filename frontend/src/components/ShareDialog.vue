<template>
  <!-- Link sharing for one collection, modelled on Google Photos: a single toggle,
       one link, no Reset button (turning off and on again mints a new token) and no
       "preview as viewer" — see docs/my-sky-collections-sharing.md §6. -->
  <teleport to="body">
    <div class="share-backdrop" @click.self="close">
      <div class="share-dialog" role="dialog" aria-modal="true" :aria-label="`Share ${collection.title}`">
        <header class="share-head">
          <h3>Share “{{ collection.title }}”</h3>
          <button class="share-x" @click="close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <label class="toggle-row" :class="{ busy }">
          <span class="toggle-text">
            <span class="toggle-title">Anyone with the link can view</span>
            <span class="toggle-sub">{{ on ? 'The link is live.' : 'Only you can see this collection.' }}</span>
          </span>
          <input class="toggle-input" type="checkbox" :checked="on" :disabled="busy" @change="onToggle($event.target.checked)" />
          <span class="toggle-track" :class="{ on }"><span class="toggle-knob"></span></span>
        </label>

        <div v-if="on" class="link-row">
          <input ref="linkRef" class="link-input" type="text" readonly :value="shareUrl" @focus="$event.target.select()" />
          <button class="copy-btn" :class="{ done: copied }" @click="copyLink()">{{ copied ? 'Copied' : copyVerb }}</button>
        </div>

        <p class="note">
          Turn off to revoke; turning on again creates a new link.
          Hidden (eye) photos are included.
        </p>
        <!-- `expires_at` is only ever set for a guest account (design §5) -->
        <p v-if="collection.expires_at" class="note guest">
          Guest account: this link stops working on {{ expiresText }} (30 days, pushed back
          whenever you come back to My Sky). Clearing this browser’s storage loses the
          collection for good.
        </p>
        <p v-if="hint" class="note hint">{{ hint }}</p>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import apiClient from '@/utils/apiClient'

const props = defineProps({
  collection: { type: Object, required: true },
})
const emit = defineEmits(['close', 'updated', 'error'])

const busy = ref(false)
const copied = ref(false)
const hint = ref('')
const linkRef = ref(null)
let copiedTimer = null

const on = computed(() => !!props.collection.share_token)
const shareUrl = computed(() => buildUrl(props.collection.share_token))
// On a phone the native share sheet is the useful action; on a desktop it is the clipboard.
const canShareSheet = typeof navigator !== 'undefined' && !!navigator.share
  && (navigator.maxTouchPoints > 0 || window.matchMedia?.('(hover: none)').matches)
const copyVerb = canShareSheet ? 'Share' : 'Copy'

const expiresText = computed(() => {
  const at = props.collection.expires_at
  if (!at) return ''
  const d = new Date(at)
  return Number.isNaN(d.getTime()) ? String(at) : d.toLocaleDateString()
})

function buildUrl(token) {
  // The API never learns the public hostname: the share URL is built here (design §4).
  return token ? `${window.location.origin}/s/${token}` : ''
}

function close() {
  emit('close')
}

function fail(err, fallback) {
  const detail = err?.response?.data?.detail
  emit('error', (typeof detail === 'string' && detail) || fallback)
}

async function onToggle(next) {
  if (busy.value) return
  busy.value = true
  hint.value = ''
  try {
    if (next) {
      const { data } = await apiClient.post(`/me/collections/${props.collection.id}/share`)
      emit('updated', { id: props.collection.id, share_token: data.token })
      await copyLink(buildUrl(data.token))   // enabling hands the link over straight away
    } else {
      await apiClient.delete(`/me/collections/${props.collection.id}/share`)
      // Revoking rotates the tile secrets of the images this link was the last to
      // publish (APO-92), so the panel has to refetch `/me/sky` for the new `base`.
      emit('updated', { id: props.collection.id, share_token: null, revoked: true })
    }
  } catch (err) {
    fail(err, next ? 'Could not create the link' : 'Could not turn sharing off')
  } finally {
    busy.value = false
  }
}

async function copyLink(url = shareUrl.value) {
  if (!url) return
  if (canShareSheet) {
    try {
      await navigator.share({ title: props.collection.title, url })
      return
    } catch (err) {
      if (err?.name === 'AbortError') return   // the user dismissed the sheet
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copied.value = false }, 1800)
  } catch {
    // clipboard blocked (no https, or no user gesture left after the request) — select instead
    linkRef.value?.select?.()
    hint.value = 'Press Ctrl+C / ⌘C to copy the link.'
  }
}

const onKey = (e) => { if (e.key === 'Escape') close() }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); clearTimeout(copiedTimer) })
</script>

<style scoped>
.share-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 12, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.share-dialog {
  width: min(440px, calc(100vw - 32px));
  background: #14171d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  color: #d7dde5;
  font-family: system-ui, -apple-system, sans-serif;
  padding: 16px 18px 18px;
}
.share-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.share-head h3 {
  margin: 0 0 2px; font-size: 1rem; font-weight: 600; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.share-x { background: none; border: none; color: #8a93a0; cursor: pointer; padding: 4px; border-radius: 6px; flex-shrink: 0; }
.share-x:hover { color: #fff; background: rgba(255, 255, 255, 0.07); }

.toggle-row {
  position: relative;
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  margin: 14px 0 4px; padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}
.toggle-row.busy { opacity: 0.6; cursor: progress; }
.toggle-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.toggle-title { font-size: 0.88rem; }
.toggle-sub { font-size: 0.74rem; color: #8a93a0; }
.toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-track {
  width: 38px; height: 22px; border-radius: 11px; flex-shrink: 0;
  background: rgba(255, 255, 255, 0.14); transition: background 0.15s; position: relative;
}
.toggle-track.on { background: #42b983; }
.toggle-knob {
  position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: transform 0.15s;
}
.toggle-track.on .toggle-knob { transform: translateX(16px); }

.link-row { display: flex; gap: 8px; margin-top: 12px; }
.link-input {
  flex: 1; min-width: 0; font-size: 0.8rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 8px 10px; border-radius: 8px; color: #cfd6df;
  border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(0, 0, 0, 0.3);
}
.copy-btn {
  padding: 8px 14px; border-radius: 8px; font-size: 0.82rem; cursor: pointer; flex-shrink: 0;
  border: 1px solid rgba(66, 185, 131, 0.5); background: rgba(66, 185, 131, 0.14); color: #42b983;
}
.copy-btn:hover { background: rgba(66, 185, 131, 0.24); }
.copy-btn.done { color: #8a93a0; border-color: rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.05); }

.note { margin: 12px 0 0; font-size: 0.75rem; line-height: 1.5; color: #8a93a0; }
.note.guest { color: #c8b273; }
.note.hint { color: #d7dde5; }
</style>
