<template>
    <div class="terrain-toggle">
        <button class="location-button" @click="toggleTerrain">🌍</button>
    </div>
</template>

<script>
export default {
    name: 'TerrainToggleButton',
    methods: {
        toggleTerrain() {
            this.$emit('toggle-terrain');
        }
    }
}
</script>

<style scoped>
.terrain-toggle {
    display: inline-block;
}

.location-button {
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

.location-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
}
</style>
