<template>
  <div class="container">
    <h1>My Submissions</h1>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="error" class="empty">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="submissions.length === 0" class="empty">
      <p>No submissions yet.</p>
      <router-link to="/solve" class="btn">Upload an image</router-link>
    </div>

    <div v-else class="grid">
      <div
        v-for="sub in submissions"
        :key="sub.id"
        class="card"
        @click="openSubmission(sub)"
      >
        <div class="thumbnail">
          <img v-if="sub.thumbnail_url" :src="sub.thumbnail_url" :alt="sub.filename" />
          <div v-else class="placeholder">No image</div>
        </div>
        <div class="info">
          <div class="info-top">
            <div class="filename">{{ sub.filename }}</div>
            <button class="delete-btn" @click.stop="deleteSubmission(sub.id)" title="Delete">✕</button>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/utils/apiClient'

const router = useRouter()
const submissions = ref([])
const total = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(null)
const PAGE_SIZE = 20

async function fetchSubmissions(offset = 0) {
  const { data } = await apiClient.get(`/submissions?limit=${PAGE_SIZE}&offset=${offset}`)
  return data
}

onMounted(async () => {
  try {
    const data = await fetchSubmissions()
    submissions.value = data.items
    total.value = data.total
  } catch (e) {
    error.value = 'Failed to load submissions: ' + (e.response?.data?.detail || e.message)
  } finally {
    loading.value = false
  }
})

async function loadMore() {
  loadingMore.value = true
  try {
    const data = await fetchSubmissions(submissions.value.length)
    submissions.value.push(...data.items)
    total.value = data.total
  } finally {
    loadingMore.value = false
  }
}

async function openSubmission(sub) {
  try {
    // Get submission details with tasks
    const { data } = await apiClient.get(`/submissions/${sub.id}`)
    if (data.tasks && data.tasks.length > 0) {
      // Navigate to latest task
      const latestTask = data.tasks[data.tasks.length - 1]
      router.push(`/solve/${latestTask.id}`)
    } else {
      // No task yet — go to solve page to create one
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
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #fff;
  margin-bottom: 1.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.card {
  background: rgba(28, 28, 36, 0.95);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.15s, transform 0.15s;
}

.card:hover {
  border-color: #42b983;
  transform: translateY(-2px);
}

.thumbnail {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #111;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 0.9em;
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
  font-size: 0.9em;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 0.9em;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.delete-btn:hover {
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-completed { background: #d1fae5; color: #065f46; }
.badge-processing { background: #dbeafe; color: #1e40af; }
.badge-pending { background: #fef3c7; color: #92400e; }
.badge-uploaded { background: #e0e7ff; color: #3730a3; }
.badge-failed { background: #fee2e2; color: #991b1b; }

.meta {
  color: #888;
  font-size: 0.8em;
  margin-top: 6px;
}

.loading, .empty {
  color: #aaa;
  text-align: center;
  padding: 3rem;
}

.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border-radius: 6px;
  text-decoration: none;
}

.load-more {
  text-align: center;
  margin-top: 1.5rem;
}

.load-more button {
  padding: 0.5rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
}
</style>
