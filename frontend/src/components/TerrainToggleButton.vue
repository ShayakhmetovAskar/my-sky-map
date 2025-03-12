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
    background: #333;
    color: #fff;
    font-size: 18px;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    transition: background 0.2s;
}

.location-button:hover {
    background: #555;
}
</style>
