<template>
    <div class="solve-page">
        <h1 class="page-title">Plate Solver</h1>

        <!-- Stepper -->
        <div v-if="activeStep > 0" class="stepper">
            <div v-for="(step, i) in steps" :key="i" class="step" :class="{ done: activeStep > i + 1, active: activeStep === i + 1 }">
                <div class="step-circle">
                    <svg v-if="activeStep > i + 1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span v-else>{{ i + 1 }}</span>
                </div>
                <span class="step-label">{{ step }}</span>
                <div v-if="i < steps.length - 1" class="step-line" :class="{ filled: activeStep > i + 1 }"></div>
            </div>
        </div>

        <!-- Upload form with Drag and Drop -->
        <div class="upload-section" v-if="!isLoading && !currentTask">
            <!-- File preview -->
            <div v-if="file" class="file-preview">
                <div class="preview-thumb">
                    <img v-if="previewUrl" :src="previewUrl" alt="Preview" />
                    <div v-else class="preview-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                </div>
                <div class="preview-info">
                    <div class="preview-name">{{ file.name }}</div>
                    <div class="preview-size">{{ formatFileSize(file.size) }}</div>
                </div>
                <button class="preview-remove" @click="removeFile" title="Remove">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <!-- Drop zone -->
            <div v-else class="drop-zone" :class="{ dragover: isDragging }"
                 @drop.prevent="handleDrop" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
                 @click="$refs.fileInput.click()">
                <input ref="fileInput" type="file" @change="handleFileUpload" accept="image/*,.fits,.fit" class="file-input" />
                <div class="drop-icon" :class="{ bounce: isDragging }">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M12 16V8m0 0l-3 3m3-3l3 3"/>
                        <path d="M20 16.7428C21.2215 15.734 22 14.2079 22 12.5C22 9.46243 19.5376 7 16.5 7C16.2815 7 16.0771 6.886 15.9661 6.69774C14.6621 4.48484 12.2544 3 9.5 3C5.35786 3 2 6.35786 2 10.5C2 12.5661 2.83545 14.4371 4.18695 15.7935"/>
                    </svg>
                </div>
                <p class="drop-title">Drag & drop your astronomy image</p>
                <p class="drop-subtitle">JPEG, PNG, or FITS</p>
            </div>

            <button class="solve-btn" @click="uploadImage" :disabled="!file || isUploading">
                <svg v-if="!isUploading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                <span v-if="isUploading" class="spinner"></span>
                {{ isUploading ? uploadStatus : 'Solve Image' }}
            </button>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-state">
            <span class="spinner large"></span>
            <p>Loading task data...</p>
        </div>

        <!-- Status display -->
        <div v-if="currentTask" class="status-section">
            <div v-if="currentTask.status === 'processing' || currentTask.status === 'pending'" class="processing-state">
                <span class="spinner large"></span>
                <p class="processing-text">{{ currentTask.status === 'pending' ? 'Queued...' : 'Solving your image...' }}</p>
                <p class="processing-sub">This may take a few minutes</p>
            </div>

            <div v-if="currentTask.status === 'completed'" class="result">
                <h2 class="result-title">Solution Found</h2>

                <div class="result-cards" v-if="parsedResult">
                    <div class="result-card" v-if="parsedResult.center_ra != null && parsedResult.center_dec != null">
                        <div class="result-card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42b983" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </div>
                        <div class="result-card-body">
                            <div class="result-card-label">Center Coordinates</div>
                            <div class="result-card-value">RA {{ parsedResult.center_ra.toFixed(4) }}°</div>
                            <div class="result-card-value">Dec {{ parsedResult.center_dec.toFixed(4) }}°</div>
                        </div>
                    </div>

                    <div class="result-card" v-if="parsedResult.pixel_scale">
                        <div class="result-card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42b983" stroke-width="2"><path d="M21 3H3v18h18V3z"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                        </div>
                        <div class="result-card-body">
                            <div class="result-card-label">Pixel Scale</div>
                            <div class="result-card-value">{{ parsedResult.pixel_scale.toFixed(3) }} arcsec/px</div>
                        </div>
                    </div>

                    <div class="result-card" v-if="parsedResult.orientation != null">
                        <div class="result-card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42b983" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/></svg>
                        </div>
                        <div class="result-card-body">
                            <div class="result-card-label">Orientation</div>
                            <div class="result-card-value">{{ parsedResult.orientation.toFixed(2) }}°</div>
                        </div>
                    </div>

                    <div class="result-card" v-if="parsedResult.field_w != null && parsedResult.field_h != null">
                        <div class="result-card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#42b983" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20"/><path d="M17 2v20"/></svg>
                        </div>
                        <div class="result-card-body">
                            <div class="result-card-label">Field of View</div>
                            <div class="result-card-value">{{ parsedResult.field_w.toFixed(2) }}° × {{ parsedResult.field_h.toFixed(2) }}°</div>
                        </div>
                    </div>
                </div>

                <a v-if="parsedResult?.astrometry_job_url" :href="parsedResult.astrometry_job_url" target="_blank" rel="noopener" class="nova-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    View on nova.astrometry.net
                </a>

                <div v-if="annotatedImageUrl" class="annotated-section">
                    <h3>Annotated Image</h3>
                    <div class="annotated-image-wrapper">
                        <div v-if="!annotatedLoaded" class="image-placeholder">
                            <span class="spinner large"></span>
                        </div>
                        <img :src="annotatedImageUrl" alt="Annotated result" @load="annotatedLoaded = true" :class="{ hidden: !annotatedLoaded }" />
                    </div>
                </div>
            </div>

            <div v-else-if="currentTask.status === 'failed'" class="error-state">
                <div class="error-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
                <h3>Solving Failed</h3>
                <pre v-if="currentTask.error" class="error-detail">{{ currentTask.error.message || currentTask.error }}</pre>
            </div>
        </div>

        <!-- Error notifications -->
        <div v-if="error" class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ error }}
        </div>
    </div>

    <div v-if="currentTask?.status === 'completed'" class="scene-section" :class="{ fullscreen: sceneFullscreen }">
        <div class="scene-header">
            <h3>Sky View</h3>
            <button class="fullscreen-btn" @click="sceneFullscreen = !sceneFullscreen" :title="sceneFullscreen ? 'Exit fullscreen' : 'Fullscreen'">
                <svg v-if="!sceneFullscreen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>
            </button>
        </div>
        <div class="scene-container">
            <Scene :taskId="String(currentTask.id)" :embedded="!sceneFullscreen" />
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
const previewUrl = ref(null)
const currentTask = ref(null)
const isUploading = ref(false)
const isLoading = ref(false)
const error = ref(null)
const uploadStatus = ref(null)
const uploadStep = ref(0) // 0=idle, 1=upload, 2=confirm, 3=solve
const isDragging = ref(false)
const sceneFullscreen = ref(false)
const annotatedLoaded = ref(false)
let statusPollingInterval = null

const POLL_INTERVAL = 2000

const steps = ['Upload', 'Confirm', 'Solve', 'Done']

const activeStep = computed(() => {
    if (currentTask.value) {
        const s = currentTask.value.status
        if (s === 'completed') return 5
        if (s === 'processing' || s === 'pending') return 3
        if (s === 'failed') return 0
    }
    return uploadStep.value
})

const parsedResult = computed(() => {
    return currentTask.value?.result || null
})

const annotatedImageUrl = computed(() => {
    if (parsedResult.value?.annotated_image_url) {
        return parsedResult.value.annotated_image_url
    }
    return ''
})

// ─── File handling ───────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

const handleFileUpload = (event) => {
    const f = event.target.files[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXTENSIONS.test(f.name)) {
        error.value = 'Please select an image file (JPEG, PNG, or FITS).'
        return
    }
    if (f.size > MAX_FILE_SIZE) {
        error.value = 'File is too large (max 100 MB).'
        return
    }
    error.value = null
    setFile(f)
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/fits']
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|fits|fit)$/i

const handleDrop = (event) => {
    isDragging.value = false
    const droppedFile = event.dataTransfer.files[0]
    if (!droppedFile || (!ALLOWED_TYPES.includes(droppedFile.type) && !ALLOWED_EXTENSIONS.test(droppedFile.name))) {
        error.value = 'Please drop an image file (JPEG, PNG, or FITS).'
    } else if (droppedFile.size > MAX_FILE_SIZE) {
        error.value = 'File is too large (max 100 MB).'
    } else {
        error.value = null
        setFile(droppedFile)
    }
}

const handleDragOver = (event) => {
    event.preventDefault()
    isDragging.value = true
}

const handleDragLeave = () => {
    isDragging.value = false
}

function setFile(f) {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    file.value = f
    if (f && f.type.startsWith('image/')) {
        previewUrl.value = URL.createObjectURL(f)
    } else {
        previewUrl.value = null
    }
}

function removeFile() {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    file.value = null
    previewUrl.value = null
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ─── Upload flow (4 steps) ───────────────────────────────────────────────────

const uploadImage = async () => {
    if (!file.value) return

    isUploading.value = true
    error.value = null

    try {
        // Step 1: Create submission
        uploadStep.value = 1
        uploadStatus.value = 'Creating submission...'
        let contentType = file.value.type
        if (/\.(fits|fit)$/i.test(file.value.name)) {
            contentType = 'application/fits'
        } else if (!contentType || !['image/jpeg', 'image/png'].includes(contentType)) {
            contentType = 'application/octet-stream'
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
        uploadStep.value = 2
        uploadStatus.value = 'Confirming...'
        await apiClient.post(`/submissions/${submission.submission_id}/confirm`)

        // Step 4: Create task
        uploadStep.value = 3
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
        uploadStep.value = 0
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

const onKeydown = (e) => { if (e.key === 'Escape') sceneFullscreen.value = false }

onMounted(async () => {
    window.addEventListener('keydown', onKeydown)
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
    window.removeEventListener('keydown', onKeydown)
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

watch(() => route.params.taskId, async (newTaskId) => {
    if (!newTaskId) {
        stopStatusPolling()
        currentTask.value = null
        file.value = null
        error.value = null
        isLoading.value = false
        annotatedLoaded.value = false
        sceneFullscreen.value = false
        removeFile()
        return
    }
    if (String(newTaskId) !== String(currentTask.value?.id)) {
        stopStatusPolling()
        sceneFullscreen.value = false
        isLoading.value = true
        try {
            const data = await fetchTaskStatus(newTaskId)
            if (route.params.taskId !== newTaskId) return
            if (['pending', 'processing'].includes(data.status)) {
                startStatusPolling(newTaskId)
            }
        } catch (err) {
            if (route.params.taskId !== newTaskId) return
            error.value = 'Error loading task: ' + err.message
        } finally {
            isLoading.value = false
        }
    }
})
</script>

<style scoped>
.solve-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 80px 20px 20px;
    width: 100%;
    box-sizing: border-box;
}

.page-title {
    color: #fff;
    font-size: 1.5em;
    margin-bottom: 1.5rem;
}

/* ─── Stepper ─────────────────────────────────────────────────────────────── */

.stepper {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    padding: 16px 20px;
    background: rgba(18, 18, 24, 0.6);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
}

.step {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}

.step:last-child {
    flex: 0 0 auto;
}

.step-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    font-weight: 600;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.08);
    color: #666;
    border: 2px solid rgba(255, 255, 255, 0.15);
    transition: all 0.3s;
}

.step.active .step-circle {
    background: rgba(66, 185, 131, 0.15);
    border-color: #42b983;
    color: #42b983;
}

.step.done .step-circle {
    background: #42b983;
    border-color: #42b983;
    color: #fff;
}

.step-label {
    margin-left: 8px;
    font-size: 0.8em;
    color: #555;
    white-space: nowrap;
    transition: color 0.3s;
}

.step.active .step-label {
    color: #42b983;
}

.step.done .step-label {
    color: #ccc;
}

.step-line {
    flex: 1;
    height: 2px;
    margin: 0 12px;
    background: rgba(255, 255, 255, 0.1);
    transition: background 0.3s;
}

.step-line.filled {
    background: #42b983;
}

/* ─── Drop Zone ───────────────────────────────────────────────────────────── */

.upload-section {
    margin-bottom: 2rem;
}

.drop-zone {
    padding: 3rem 2rem;
    border: 2px dashed rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    text-align: center;
    background: rgba(18, 18, 24, 0.6);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}

.drop-zone:hover {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(18, 18, 24, 0.8);
}

.drop-zone.dragover {
    border-color: #42b983;
    background: rgba(66, 185, 131, 0.05);
}

.file-input {
    display: none;
}

.drop-icon {
    color: #555;
    margin-bottom: 12px;
    transition: color 0.2s, transform 0.2s;
}

.drop-zone:hover .drop-icon {
    color: #888;
}

.drop-zone.dragover .drop-icon {
    color: #42b983;
    transform: scale(1.1);
}

.drop-icon.bounce {
    animation: bounce 0.6s ease infinite alternate;
}

@keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-6px) scale(1.1); }
}

.drop-title {
    color: #ccc;
    font-size: 1em;
    margin: 0 0 4px;
}

.drop-subtitle {
    color: #666;
    font-size: 0.8em;
    margin: 0;
}

/* ─── File Preview ────────────────────────────────────────────────────────── */

.file-preview {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: rgba(18, 18, 24, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    margin-bottom: 1rem;
}

.preview-thumb {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.3);
}

.preview-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preview-icon {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-info {
    flex: 1;
    min-width: 0;
}

.preview-name {
    color: #fff;
    font-size: 0.9em;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.preview-size {
    color: #888;
    font-size: 0.8em;
    margin-top: 2px;
}

.preview-remove {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;
}

.preview-remove:hover {
    color: #f44336;
    background: rgba(244, 67, 54, 0.1);
}

/* ─── Solve Button ────────────────────────────────────────────────────────── */

.solve-btn {
    width: 100%;
    padding: 12px 20px;
    margin-top: 12px;
    background: #42b983;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s, transform 0.1s;
}

.solve-btn:hover:not(:disabled) {
    background: #38a375;
    transform: translateY(-1px);
}

.solve-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: #666;
    cursor: not-allowed;
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
}

.spinner.large {
    width: 32px;
    height: 32px;
    border-width: 3px;
    border-color: rgba(66, 185, 131, 0.2);
    border-top-color: #42b983;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ─── Loading State ───────────────────────────────────────────────────────── */

.loading-state {
    text-align: center;
    padding: 3rem;
    color: #aaa;
}

.loading-state p {
    margin-top: 1rem;
}

/* ─── Processing State ────────────────────────────────────────────────────── */

.processing-state {
    text-align: center;
    padding: 3rem 1rem;
}

.processing-text {
    color: #fff;
    font-size: 1.1em;
    margin-top: 1.5rem;
}

.processing-sub {
    color: #888;
    font-size: 0.85em;
    margin-top: 0.5rem;
}

/* ─── Result ──────────────────────────────────────────────────────────────── */

.status-section {
    margin-top: 1rem;
}

.result-title {
    color: #42b983;
    font-size: 1.2em;
    margin-bottom: 1.2rem;
}

.result-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 2rem;
}

.result-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    background: rgba(18, 18, 24, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    transition: border-color 0.15s;
}

.result-card:hover {
    border-color: rgba(66, 185, 131, 0.3);
}

.result-card-icon {
    flex-shrink: 0;
    margin-top: 2px;
}

.result-card-label {
    color: #888;
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
}

.result-card-value {
    color: #fff;
    font-size: 0.9em;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

/* ─── Annotated Image ─────────────────────────────────────────────────────── */

.annotated-section h3 {
    color: #ccc;
    font-size: 1em;
    margin-bottom: 1rem;
}

.annotated-image-wrapper {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    min-height: 200px;
    position: relative;
}

.annotated-image-wrapper img {
    width: 100%;
    max-height: 70vh;
    object-fit: contain;
    display: block;
}

.annotated-image-wrapper img.hidden {
    display: none;
}

.image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

/* ─── Error States ────────────────────────────────────────────────────────── */

.error-state {
    text-align: center;
    padding: 2rem 1rem;
}

.error-icon {
    margin-bottom: 1rem;
}

.error-state h3 {
    color: #f44336;
    margin-bottom: 0.5rem;
}

.error-detail {
    color: #ccc;
    font-size: 0.85em;
    padding: 12px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.2);
    border-radius: 8px;
    text-align: left;
    white-space: pre-wrap;
    max-width: 100%;
    overflow-x: auto;
}

.error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #f44336;
    margin-top: 1rem;
    padding: 12px 16px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.2);
    border-radius: 10px;
    font-size: 0.9em;
}

/* ─── Nova Link ───────────────────────────────────────────────────────────── */

.nova-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #42b983;
    font-size: 0.85em;
    text-decoration: none;
    margin-top: 1rem;
    padding: 6px 12px;
    border-radius: 6px;
    background: rgba(66, 185, 131, 0.08);
    border: 1px solid rgba(66, 185, 131, 0.2);
    transition: all 0.15s;
}

.nova-link:hover {
    background: rgba(66, 185, 131, 0.15);
    border-color: rgba(66, 185, 131, 0.4);
}

/* ─── Scene Section ───────────────────────────────────────────────────────── */

.scene-section {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 20px;
}

.scene-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.scene-header h3 {
    color: #ccc;
    font-size: 1em;
    margin: 0;
}

.fullscreen-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #aaa;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
}

.fullscreen-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
}

.scene-container {
    position: relative;
    width: 100%;
    height: 500px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #000;
}

.scene-container :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
    display: block;
}

.scene-container :deep(.three-container) {
    width: 100%;
    height: 100%;
}

/* Fullscreen mode */
.scene-section.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: none;
    margin: 0;
    padding: 0;
    z-index: 2000;
    background: #000;
}

.scene-section.fullscreen .scene-header {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    margin: 0;
}

.scene-section.fullscreen .scene-header h3 {
    display: none;
}

.scene-section.fullscreen .fullscreen-btn {
    background: rgba(12, 12, 18, 0.8);
    backdrop-filter: blur(8px);
}

.scene-section.fullscreen .scene-container {
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: none;
    aspect-ratio: auto;
}

/* ─── Responsive ──────────────────────────────────────────────────────────── */

@media (max-width: 600px) {
    .solve-page {
        padding: 70px 12px 12px;
    }

    .stepper {
        padding: 12px;
    }

    .step-label {
        display: none;
    }

    .step-line {
        margin: 0 8px;
    }

    .result-cards {
        grid-template-columns: 1fr;
    }

    .drop-zone {
        padding: 2rem 1rem;
    }
}
</style>
