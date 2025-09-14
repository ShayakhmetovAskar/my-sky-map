<template>
    <div class="container">
        <h1>Plate Solver</h1>

        <!-- Upload form with Drag and Drop -->
        <div class="upload-section" v-if="!isLoading" @dragover.prevent @drop.prevent @dragleave.prevent>
            <div class="drop-zone" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
                <input type="file" @change="handleFileUpload" accept="image/*" />
                <p>Drag and drop an image here or click to select</p>
                <button @click="uploadImage" :disabled="!file || isUploading">
                    {{ isUploading ? 'Uploading...' : 'Process Image' }}
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
            <p>Task ID: {{ currentTask.task_id }}</p>
            <p>Status: <span :class="statusClass">{{ currentTask.status }}</span></p>

            <!-- Real-time logs display -->
            <div class="live-logs">
                <h3>Processing Logs</h3>
                <div ref="logsContainer" class="logs-window">
                    <pre>{{ logs }}</pre>
                </div>
            </div>

            <div v-if="currentTask.status === 'SUCCESS'" class="result">
                <h3>Result</h3>
                <div v-if="parsedResult">
                    <p v-if="parsedResult.center_ra && parsedResult.center_dec">
                        Center: RA {{ parsedResult.center_ra.toFixed(6) }}, Dec {{ parsedResult.center_dec.toFixed(6) }}
                    </p>
                    <p v-if="parsedResult.scale_arcsec_per_pixel">
                        Scale: {{ parsedResult.scale_arcsec_per_pixel.toFixed(3) }} arcsec/pixel
                    </p>
                </div>



                <div v-if="resultImageUrl" class="image-container">
                    <h3>Annotated Image</h3>
                    <img :src="resultImageUrl" alt="Processed result" />
                </div>
            </div>

            <div v-else-if="currentTask.status === 'FAILED'" class="error">
                <h3>Error processing image</h3>
                <pre v-if="parsedResult && parsedResult.error">{{ parsedResult.error }}</pre>
            </div>
        </div>

        <!-- Error notifications -->
        <div v-if="error" class="error">
            {{ error }}
        </div>


    </div>
    <div class="scene-wrapper">
        <div v-if="currentTask?.status === 'SUCCESS'" class="scene-wrapper" style="width: 95%; margin: 0 auto;">
            <Scene :taskId="currentTask.task_id" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

import Scene from '@/views/Scene.vue'

const route = useRoute()
const router = useRouter()
const file = ref(null)
const currentTask = ref(null)
const isUploading = ref(false)
const isLoading = ref(false)
const error = ref(null)
const statusPollingInterval = ref(null)
const logsPollingInterval = ref(null)
const logs = ref("")
const logsContainer = ref(null)
const isDragging = ref(false) // Новый ref для отслеживания состояния перетаскивания

const parsedResult = computed(() => {
    if (currentTask.value?.result) {
        try {
            return typeof currentTask.value.result === 'string'
                ? JSON.parse(currentTask.value.result)
                : currentTask.value.result;
        } catch (e) {
            console.error("Error parsing result:", e);
            return null;
        }
    }
    return null;
});

const statusClass = computed(() => {
    if (!currentTask.value) return '';
    switch (currentTask.value.status) {
        case 'SUCCESS': return 'status-success';
        case 'FAILED': return 'status-failed';
        case 'PROCESSING': return 'status-processing';
        case 'PENDING': return 'status-pending';
        default: return '';
    }
});

const resultImageUrl = computed(() => {
    if (parsedResult.value && parsedResult.value.ngc_image) {
        const parts = parsedResult.value.ngc_image.split('/');
        const filename = parts[parts.length - 1];
        return `/api/uploads/${filename}`;
    }
    return '';
});

// Auto-scroll logs to bottom
const scrollLogsToBottom = () => {
    nextTick(() => {
        if (logsContainer.value) {
            logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
        }
    });
};

// Fetch logs for a specific task
const fetchLogs = async (taskId) => {
    try {
        const response = await axios.get(`/api/logs/${taskId}`);
        logs.value = response.data.logs || "";
        scrollLogsToBottom();
    } catch (err) {
        console.error("Error fetching logs:", err);
    }
};

// Start polling for logs
const startLogsPolling = (taskId) => {
    if (logsPollingInterval.value) {
        clearInterval(logsPollingInterval.value);
    }

    fetchLogs(taskId);

    logsPollingInterval.value = setInterval(() => {
        fetchLogs(taskId);
    }, 10000);
};

// Stop logs polling
const stopLogsPolling = () => {
    if (logsPollingInterval.value) {
        clearInterval(logsPollingInterval.value);
        logsPollingInterval.value = null;
    }
};

onMounted(() => {
    const taskId = route.params.taskId;
    if (taskId) {
        isLoading.value = true;
        fetchTaskStatus(taskId)
            .then(data => {
                if (['PENDING', 'PROCESSING'].includes(data.status)) {
                    startStatusPolling(taskId);
                    startLogsPolling(taskId);
                } else {
                    fetchLogs(taskId);
                }
            })
            .catch(err => {
                error.value = 'Error loading task: ' + err.message;
            })
            .finally(() => {
                isLoading.value = false;
            });
    }

    return () => {
        if (statusPollingInterval.value) {
            clearInterval(statusPollingInterval.value);
        }
        stopLogsPolling();
    };
});

watch(() => route.params.taskId, (newTaskId) => {
    if (newTaskId && newTaskId !== currentTask.value?.task_id) {
        if (statusPollingInterval.value) {
            clearInterval(statusPollingInterval.value);
        }
        stopLogsPolling();
        logs.value = "";

        isLoading.value = true;
        fetchTaskStatus(newTaskId)
            .then(data => {
                if (['PENDING', 'PROCESSING'].includes(data.status)) {
                    startStatusPolling(newTaskId);
                    startLogsPolling(newTaskId);
                } else {
                    fetchLogs(newTaskId);
                }
            })
            .catch(err => {
                error.value = 'Error loading task: ' + err.message;
            })
            .finally(() => {
                isLoading.value = false;
            });
    }
});

const handleFileUpload = (event) => {
    file.value = event.target.files[0];
};

const handleDrop = (event) => {
    event.preventDefault();
    isDragging.value = false;
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
        file.value = droppedFile;
    } else {
        error.value = 'Please drop an image file.';
    }
};

const handleDragOver = (event) => {
    event.preventDefault();
    isDragging.value = true;
};

const handleDragLeave = () => {
    isDragging.value = false;
};

const uploadImage = async () => {
    if (!file.value) return;

    isUploading.value = true;
    error.value = null;
    logs.value = "";

    try {
        const formData = new FormData();
        formData.append('file', file.value);

        const response = await axios.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        const taskId = response.data.task_id;
        currentTask.value = response.data;

        router.push(`/solve/${taskId}`);

        startStatusPolling(taskId);
        startLogsPolling(taskId);
    } catch (err) {
        error.value = 'Error uploading image: ' + err.message;
    } finally {
        isUploading.value = false;
    }
};

const fetchTaskStatus = async (taskId) => {
    try {
        const response = await axios.get(`/api/status/${taskId}`);
        currentTask.value = response.data;
        return response.data;
    } catch (err) {
        error.value = 'Error checking status: ' + err.message;
        throw err;
    }
};

const startStatusPolling = (taskId) => {
    if (statusPollingInterval.value) {
        clearInterval(statusPollingInterval.value);
    }

    statusPollingInterval.value = setInterval(async () => {
        try {
            const data = await fetchTaskStatus(taskId);

            if (['SUCCESS', 'FAILED', 'FAILURE'].includes(data.status)) {
                clearInterval(statusPollingInterval.value);
                stopLogsPolling();

                fetchLogs(taskId);
            }
        } catch (err) {
            clearInterval(statusPollingInterval.value);
            stopLogsPolling();
        }
    }, 2000);
};
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

/* Status colors */
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

/* Live logs styling */
.live-logs {
    margin: 1rem 0 2rem;
}

.logs-window {
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #000;
    color: #00ff00;
    height: 250px;
    overflow-y: auto;
    font-family: 'Courier New', monospace;
}

.logs-window pre {
    padding: 10px;
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.85rem;
    line-height: 1.4;
}
</style>