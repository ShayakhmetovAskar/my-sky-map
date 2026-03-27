<template>
  <div class="page">
    <h1 class="page-title">My Submissions</h1>

    <!-- Status filter -->
    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-pill"
        :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
        <span v-if="f.value !== 'all' && countByStatus[f.value] && submissions.length >= total" class="filter-count">{{ countByStatus[f.value] }}</span>
      </button>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="grid">
      <div v-for="i in 6" :key="'sk-' + i" class="card skeleton-card">
        <div class="thumbnail skeleton-thumb"><div class="shimmer"></div></div>
        <div class="info">
          <div class="skeleton-line w60"><div class="shimmer"></div></div>
          <div class="skeleton-line w40"><div class="shimmer"></div></div>
          <div class="skeleton-line w30"><div class="shimmer"></div></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p class="empty-text">{{ error }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredSubmissions.length === 0 && submissions.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.2">
          <circle cx="12" cy="5" r="1" fill="#555"/>
          <circle cx="8" cy="9" r="0.7" fill="#555"/>
          <circle cx="17" cy="7" r="0.5" fill="#555"/>
          <circle cx="6" cy="14" r="0.4" fill="#555"/>
          <circle cx="19" cy="12" r="0.6" fill="#555"/>
          <path d="M8 21l2-6h4l2 6" stroke-linejoin="round"/>
          <path d="M10 15l2-3 2 3"/>
          <line x1="12" y1="12" x2="12" y2="15"/>
        </svg>
      </div>
      <p class="empty-text">No submissions yet</p>
      <p class="empty-sub">Upload your first astronomy image to get started</p>
      <router-link to="/solve" class="empty-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>
        Upload Image
      </router-link>
    </div>

    <!-- No filter results -->
    <div v-else-if="filteredSubmissions.length === 0" class="empty-state">
      <p class="empty-text">No {{ activeFilter }} submissions</p>
    </div>

    <!-- Submissions grid -->
    <div v-else class="grid">
      <div
        v-for="(sub, idx) in filteredSubmissions"
        :key="sub.id"
        class="card"
        :style="{ '--delay': idx * 0.04 + 's' }"
        @click="openSubmission(sub)"
      >
        <div class="thumbnail">
          <img v-if="sub.thumbnail_url" :src="sub.thumbnail_url" :alt="sub.filename" />
          <div v-else class="placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
        </div>
        <div class="info">
          <div class="info-top">
            <div class="filename">{{ sub.filename }}</div>
            <button class="delete-btn" @click.stop="deleteSubmission(sub.id)" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <span class="badge" :class="'badge-' + sub.status">{{ sub.status }}</span>
          <div class="meta">{{ formatTime(sub.created_at) }}</div>
        </div>
      </div>
    </div>

    <div v-if="total > submissions.length" class="load-more">
      <button @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? 'Loading...' : 'Load more' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/utils/apiClient'

const router = useRouter()
const submissions = ref([])
const total = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(null)
const activeFilter = ref('all')
const PAGE_SIZE = 20

let refreshInterval = null

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
]

const countByStatus = computed(() => {
  const counts = {}
  for (const sub of submissions.value) {
    counts[sub.status] = (counts[sub.status] || 0) + 1
  }
  return counts
})

const filteredSubmissions = computed(() => {
  if (activeFilter.value === 'all') return submissions.value
  return submissions.value.filter(s => s.status === activeFilter.value)
})

const hasActiveSubmissions = computed(() => {
  return submissions.value.some(s => s.status === 'pending' || s.status === 'processing')
})

async function fetchSubmissions(offset = 0) {
  const { data } = await apiClient.get(`/submissions?limit=${PAGE_SIZE}&offset=${offset}`)
  return data
}

onMounted(async () => {
  try {
    const data = await fetchSubmissions()
    submissions.value = data.items
    total.value = data.total
    startAutoRefresh()
  } catch (e) {
    error.value = 'Failed to load submissions: ' + (e.response?.data?.detail || e.message)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

onActivated(async () => {
  // Refetch when returning from keep-alive cache
  try {
    const data = await fetchSubmissions()
    submissions.value = data.items
    total.value = data.total
    startAutoRefresh()
  } catch {
    // silent — existing data stays
  }
})

function startAutoRefresh() {
  stopAutoRefresh()
  refreshInterval = setInterval(async () => {
    if (!hasActiveSubmissions.value) {
      stopAutoRefresh()
      return
    }
    try {
      // Fetch up to current loaded count to avoid truncating load-more'd items
      const count = Math.max(submissions.value.length, PAGE_SIZE)
      const { data } = await apiClient.get(`/submissions?limit=${count}&offset=0`)
      submissions.value = data.items
      total.value = data.total
    } catch {
      // silent
    }
  }, 3000)
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

async function loadMore() {
  loadingMore.value = true
  try {
    const data = await fetchSubmissions(submissions.value.length)
    submissions.value.push(...data.items)
    total.value = data.total
  } catch (e) {
    error.value = 'Failed to load more: ' + (e.response?.data?.detail || e.message)
  } finally {
    loadingMore.value = false
  }
}

async function openSubmission(sub) {
  try {
    const { data } = await apiClient.get(`/submissions/${sub.id}`)
    if (data.tasks && data.tasks.length > 0) {
      const latestTask = data.tasks[data.tasks.length - 1]
      router.push(`/solve/${latestTask.id}`)
    } else {
      router.push('/solve')
    }
  } catch {
    router.push('/solve')
  }
}

async function deleteSubmission(id) {
  if (!confirm('Delete this submission?')) return
  try {
    await apiClient.delete(`/submissions/${id}`)
    submissions.value = submissions.value.filter(s => s.id !== id)
    total.value--
  } catch (e) {
    alert('Failed to delete: ' + (e.response?.data?.detail || e.message))
  }
}

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
}
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 20px 20px;
}

.page-title {
  color: #fff;
  font-size: 1.5em;
  margin-bottom: 1.2rem;
}

/* ─── Filter Bar ──────────────────────────────────────────────────────────── */

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-pill {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 500;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  color: #aaa;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-pill:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.filter-pill.active {
  background: rgba(66, 185, 131, 0.15);
  color: #42b983;
  border-color: rgba(66, 185, 131, 0.4);
}

.filter-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.85em;
}

.filter-pill.active .filter-count {
  background: rgba(66, 185, 131, 0.25);
}

/* ─── Grid ────────────────────────────────────────────────────────────────── */

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* ─── Card ────────────────────────────────────────────────────────────────── */

.card {
  background: rgba(18, 18, 24, 0.8);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  animation: cardIn 0.3s ease both;
  animation-delay: var(--delay, 0s);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card:hover {
  border-color: rgba(66, 185, 131, 0.5);
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 4px 20px rgba(66, 185, 131, 0.1);
}

.thumbnail {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.card:hover .thumbnail img {
  transform: scale(1.05);
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  padding: 12px;
}

.info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.filename {
  color: #fff;
  font-size: 0.85em;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.delete-btn:hover {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

/* ─── Badges (dark theme) ─────────────────────────────────────────────────── */

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-completed { background: rgba(66, 185, 131, 0.15); color: #42b983; }
.badge-processing { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.badge-uploaded { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
.badge-failed { background: rgba(244, 67, 54, 0.15); color: #f87171; }

.meta {
  color: #666;
  font-size: 0.75em;
  margin-top: 6px;
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

.skeleton-card {
  pointer-events: none;
}

.skeleton-thumb {
  background: rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
}

.skeleton-line.w60 { width: 60%; }
.skeleton-line.w40 { width: 40%; }
.skeleton-line.w30 { width: 30%; }

.shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
}

.empty-icon {
  margin-bottom: 1.2rem;
}

.empty-text {
  color: #aaa;
  font-size: 1.1em;
  margin-bottom: 0.3rem;
}

.empty-sub {
  color: #666;
  font-size: 0.85em;
  margin-bottom: 1.5rem;
}

.empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #42b983;
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9em;
  font-weight: 500;
  transition: background 0.15s;
}

.empty-btn:hover {
  background: #38a375;
}

/* ─── Load More ───────────────────────────────────────────────────────────── */

.load-more {
  text-align: center;
  margin-top: 1.5rem;
}

.load-more button {
  padding: 8px 24px;
  background: rgba(255, 255, 255, 0.06);
  color: #aaa;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.15s;
}

.load-more button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* ─── Responsive ──────────────────────────────────────────────────────────── */

@media (max-width: 600px) {
  .page {
    padding: 70px 12px 12px;
  }

  .grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }

  .filter-bar {
    gap: 6px;
  }

  .filter-pill {
    padding: 5px 10px;
    font-size: 0.75em;
  }
}
</style>
