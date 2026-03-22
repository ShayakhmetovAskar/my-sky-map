<template>
    <div class="container">
        <h1>Plate Solver</h1>

        <!-- Upload form with Drag and Drop -->
        <div class="upload-section" v-if="!isLoading && !currentTask" @dragover.prevent @drop.prevent @dragleave.prevent>
            <div class="drop-zone" :class="{ dragover: isDragging }" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
                <input type="file" @change="handleFileUpload" accept="image/*,.fits,.fit" />
                <p>Drag and drop an image here or click to select</p>
                <p v-if="file" class="file-info">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</p>
                <button @click="uploadImage" :disabled="!file || isUploading">
                    {{ uploadStatus || 'Process Image' }}
                </button>
            </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading">
            Loading task data...
        </div>

        <!-- Status display -->
        <div v-if="currentTask" class="status-section">
            <h2>Processing Status</h2>
            <p>Task ID: {{ currentTask.id }}</p>
            <p>Status: <span :class="statusClass">{{ currentTask.status }}</span></p>

            <div v-if="currentTask.status === 'completed'" class="result">
                <h3>Result</h3>
                <div v-if="parsedResult">
                    <p v-if="parsedResult.center_ra != null && parsedResult.center_dec != null">
                        Center: RA {{ parsedResult.center_ra.toFixed(6) }}, Dec {{ parsedResult.center_dec.toFixed(6) }}
                    </p>
                    <p v-if="parsedResult.pixel_scale">
                        Scale: {{ parsedResult.pixel_scale.toFixed(3) }} arcsec/pixel
                    </p>
                </div>

                <div v-if="annotatedImageUrl" class="image-container">
                    <h3>Annotated Image</h3>
                    <img :src="annotatedImageUrl" alt="Processed result" />
                </div>
            </div>

            <div v-else-if="currentTask.status === 'failed'" class="error">
                <h3>Error processing image</h3>
                <pre v-if="currentTask.error">{{ currentTask.error.message }}</pre>
            </div>
        </div>

        <!-- Error notifications -->
        <div v-if="error" class="error">
            {{ error }}
        </div>
    </div>

    <div class="scene-wrapper">
        <div v-if="currentTask?.status === 'completed'" class="scene-wrapper" style="width: 95%; margin: 0 auto;">
            <Scene :taskId="currentTask.id" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/utils/apiClient'

import Scene from '@/views/Scene.vue'

const route = useRoute()
const router = useRouter()
const file = ref(null)
const currentTask = ref(null)
const isUploading = ref(false)
const isLoading = ref(false)
const error = ref(null)
const uploadStatus = ref(null)
const isDragging = ref(false)
let statusPollingInterval = null

const POLL_INTERVAL = 2000

const parsedResult = computed(() => {
    return currentTask.value?.result || null
})

const statusClass = computed(() => {
    if (!currentTask.value) return ''
    switch (currentTask.value.status) {
        case 'completed': return 'status-success'
        case 'failed': return 'status-failed'
        case 'processing': return 'status-processing'
        case 'pending': return 'status-pending'
        default: return ''
    }
})

const annotatedImageUrl = computed(() => {
    if (parsedResult.value?.annotated_image_url) {
        return parsedResult.value.annotated_image_url
    }
    return ''
})

// ─── File handling ───────────────────────────────────────────────────────────

const handleFileUpload = (event) => {
    file.value = event.target.files[0]
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/fits']
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|fits|fit)$/i

const handleDrop = (event) => {
    event.preventDefault()
    isDragging.value = false
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && (ALLOWED_TYPES.includes(droppedFile.type) || ALLOWED_EXTENSIONS.test(droppedFile.name))) {
        file.value = droppedFile
    } else {
        error.value = 'Please drop an image file (JPEG, PNG, or FITS).'
    }
}

const handleDragOver = (event) => {
    event.preventDefault()
    isDragging.value = true
}

const handleDragLeave = () => {
    isDragging.value = false
}

// ─── Upload flow (4 steps) ───────────────────────────────────────────────────

const uploadImage = async () => {
    if (!file.value) return

    isUploading.value = true
    error.value = null

    try {
        // Step 1: Create submission
        uploadStatus.value = 'Creating submission...'
        // Normalize to API enum: image/jpeg, image/png, application/fits
        let contentType = file.value.type
        if (/\.(fits|fit)$/i.test(file.value.name)) {
            contentType = 'application/fits'
        } else if (!contentType || !['image/jpeg', 'image/png'].includes(contentType)) {
            contentType = 'image/jpeg'
        }
        const { data: submission } = await apiClient.post('/submissions', {
            filename: file.value.name,
            content_type: contentType,
            file_size_bytes: file.value.size,
        })

        // Step 2: Upload file to presigned URL
        uploadStatus.value = 'Uploading file...'
        const uploadRes = await fetch(submission.upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file.value,
        })
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`)

        // Step 3: Confirm upload
        uploadStatus.value = 'Confirming...'
        await apiClient.post(`/submissions/${submission.submission_id}/confirm`)

        // Step 4: Create task
        uploadStatus.value = 'Starting solver...'
        const { data: task } = await apiClient.post('/tasks', {
            submission_id: submission.submission_id,
        })

        currentTask.value = task
        router.push(`/solve/${task.id}`)
        startStatusPolling(task.id)

    } catch (err) {
        error.value = 'Error: ' + (err.response?.data?.detail || err.message)
    } finally {
        isUploading.value = false
        uploadStatus.value = null
    }
}

// ─── Task status polling ─────────────────────────────────────────────────────

const fetchTaskStatus = async (taskId) => {
    try {
        const { data } = await apiClient.get(`/tasks/${taskId}`)
        currentTask.value = data
        return data
    } catch (err) {
        error.value = 'Error checking status: ' + (err.response?.data?.detail || err.message)
        throw err
    }
}

const startStatusPolling = (taskId) => {
    stopStatusPolling()
    statusPollingInterval = setInterval(async () => {
        try {
            const data = await fetchTaskStatus(taskId)
            if (['completed', 'failed', 'cancelled'].includes(data.status)) {
                stopStatusPolling()
            }
        } catch {
            stopStatusPolling()
        }
    }, POLL_INTERVAL)
}

const stopStatusPolling = () => {
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval)
        statusPollingInterval = null
    }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
    const taskId = route.params.taskId
    if (taskId) {
        isLoading.value = true
        try {
            const data = await fetchTaskStatus(taskId)
            if (['pending', 'processing'].includes(data.status)) {
                startStatusPolling(taskId)
            }
        } catch (err) {
            error.value = 'Error loading task: ' + err.message
        } finally {
            isLoading.value = false
        }
    }
})

onUnmounted(() => {
    stopStatusPolling()
})

watch(() => route.params.taskId, async (newTaskId) => {
    if (newTaskId && newTaskId !== currentTask.value?.id) {
        stopStatusPolling()
        isLoading.value = true
        try {
            const data = await fetchTaskStatus(newTaskId)
            if (['pending', 'processing'].includes(data.status)) {
                startStatusPolling(newTaskId)
            }
        } catch (err) {
            error.value = 'Error loading task: ' + err.message
        } finally {
            isLoading.value = false
        }
    }
})
</script>

<style scoped>
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
}

.scene-wrapper {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    position: relative;
    margin: 20px 0;
}

.scene-wrapper :deep(canvas) {
    max-width: 100%;
    height: auto !important;
    display: block;
}

.upload-section {
    margin: 2rem 0;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.drop-zone {
    padding: 2rem;
    border: 2px dashed #ccc;
    border-radius: 4px;
    text-align: center;
    background: #f9f9f9;
    cursor: pointer;
}

.drop-zone.dragover {
    background: #e1f0ff;
    border-color: #2196f3;
    color: #2196f3;
}

.file-info {
    color: #666;
    font-size: 0.85rem;
    margin-top: 0.5rem;
}

button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.status-section {
    margin-top: 2rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 4px;
}

.error {
    color: #ff4444;
    margin-top: 1rem;
    padding: 1rem;
    background: #ffecec;
    border-radius: 4px;
}

.loading {
    margin: 2rem 0;
    padding: 1rem;
    background: #eee;
    border-radius: 4px;
    text-align: center;
}

.result img {
    max-width: 100%;
    margin-top: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.image-container {
    margin-top: 1.5rem;
}

.status-success {
    color: #4caf50;
    font-weight: bold;
}

.status-failed {
    color: #f44336;
    font-weight: bold;
}

.status-processing {
    color: #2196f3;
    font-weight: bold;
}

.status-pending {
    color: #ff9800;
    font-weight: bold;
}
</style>
