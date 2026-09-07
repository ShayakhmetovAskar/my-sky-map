<template>
  <!-- Shared collection viewer: `/s/:token`, no auth, no owner controls. -->
  <Scene v-if="state === 'ready'"
    shared
    :shared-images="images"
    :shared-title="title"
  />

  <div v-else class="public-state">
    <div class="state-card">
      <template v-if="state === 'loading'">
        <div class="spinner"></div>
        <p class="state-text">Opening the collection…</p>
      </template>

      <template v-else-if="state === 'missing'">
        <h1 class="state-title">This collection isn't available</h1>
        <p class="state-text">The link was turned off, has expired, or never existed.</p>
        <router-link to="/" class="state-btn">Explore the sky</router-link>
      </template>

      <template v-else>
        <h1 class="state-title">Couldn't load, try again</h1>
        <p class="state-text">The collection is there — the network or the server isn't answering.</p>
        <button class="state-btn" @click="load">Retry</button>
      </template>
    </div>
  </div>
</template>

<script>
// Explicit name so App.vue's <keep-alive exclude> can reach it: caching this view
// would keep a whole WebGL scene alive after the viewer navigates away.
export default { name: 'PublicSky' }
</script>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Scene from '@/views/Scene.vue'
import publicClient from '@/utils/publicClient'

const props = defineProps({
  token: { type: String, required: true },
})

// 'loading' → 'ready' | 'missing' (404: revoked, expired, never existed) | 'error'
const state = ref('loading')
const images = ref([])
const title = ref('')

/**
 * `GET /api/v1/public/sky/{token}` — unauthenticated on purpose (see publicClient).
 * A 404 is the single answer for every dead link, so it gets its own copy; anything
 * else is treated as transient and offered a retry.
 */
async function load() {
  state.value = 'loading'
  try {
    const { data } = await publicClient.get(`/public/sky/${encodeURIComponent(props.token)}`)
    title.value = data?.title || 'Shared sky'
    images.value = Array.isArray(data?.images) ? data.images : []
    state.value = 'ready'
  } catch (err) {
    state.value = err.response?.status === 404 ? 'missing' : 'error'
  }
}

onMounted(load)
watch(() => props.token, load)
</script>

<style scoped>
.public-state {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #050715 0%, #060811 50%, #050614 100%);
  color: #d7dde5;
  font-family: system-ui, -apple-system, sans-serif;
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 32px 40px;
  text-align: center;
  max-width: 420px;
}

.state-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.state-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #8a93a0;
}

.state-btn {
  margin-top: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid rgba(66, 185, 131, 0.5);
  background: rgba(66, 185, 131, 0.12);
  color: #42b983;
  font: 500 0.85rem system-ui, sans-serif;
  text-decoration: none;
  cursor: pointer;
}

.state-btn:hover {
  background: rgba(66, 185, 131, 0.22);
  color: #eafff4;
}

.spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(66, 185, 131, 0.25);
  border-top-color: #42b983;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
