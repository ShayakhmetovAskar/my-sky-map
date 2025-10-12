<template>
    <div class="track-toggle">
        <button class="track-button" :class="{ 'active': isTracking }" @click="toggleTracking">
            {{ isTracking ? '🔒' : '🔓' }}
        </button>
    </div>
</template>

<script>
export default {
    name: 'TrackButton',
    props: {
        isTracking: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        toggleTracking() {
            this.$emit('toggle-tracking');
        }
    }
}
</script>

<style scoped>
.track-toggle {
    display: inline-block;
}

.track-button {
    cursor: pointer;
    background: rgba(28, 28, 36, 0.95);
    color: #fff;
    font-size: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.track-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
}

.track-button.active {
    background: rgba(255, 87, 87, 0.3);
    border-color: rgba(255, 87, 87, 0.5);
}

.track-button.active:hover {
    background: rgba(255, 87, 87, 0.4);
}
</style>
