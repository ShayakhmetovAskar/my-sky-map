<template>
  <div class="debug-panel" v-if="isVisible">
    <div class="debug-header">
      Debug
      <button @click="isVisible = false">×</button>
    </div>
    <div class="debug-content">
      <label>
        <input
          type="checkbox"
          :checked="showTileBounds"
          @change="toggleTileBounds"
        />
        Show tile bounds
      </label>
      <label>
        <input
          type="checkbox"
          :checked="showHudDebug"
          @change="toggleHudDebug"
        />
        HUD debug info
      </label>
    </div>
  </div>
  
  <!-- Простая кнопка для открытия панели -->
  <button 
    v-if="!isVisible" 
    class="debug-toggle-btn" 
    @click="isVisible = true"
    title="Debug Panel (Ctrl+D)"
  >
    D
  </button>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import debugSettings from '@/settings/debugSettings';

export default {
  name: 'DebugPanel',
  emits: ['setting-changed'],
  setup(props, { emit }) {
    const isVisible = ref(false);
    const showTileBounds = ref(debugSettings.get('showTileBounds'));
    const showHudDebug = ref(debugSettings.get('showHudDebug'));

    const toggleTileBounds = () => {
      showTileBounds.value = !showTileBounds.value;
      debugSettings.set('showTileBounds', showTileBounds.value);
      emit('setting-changed', 'showTileBounds', showTileBounds.value);

      // Для обратной совместимости с textureLoader
      window.dispatchEvent(new CustomEvent('debug-settings-changed', {
        detail: { showTileBounds: showTileBounds.value }
      }));
    };

    const toggleHudDebug = () => {
      showHudDebug.value = !showHudDebug.value;
      debugSettings.set('showHudDebug', showHudDebug.value);
    };

    // Горячая клавиша Ctrl+D для открытия/закрытия панели
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        isVisible.value = !isVisible.value;
      }
    };

    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });

    return {
      isVisible,
      showTileBounds,
      showHudDebug,
      toggleTileBounds,
      toggleHudDebug,
    };
  }
};
</script>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 12px;
  left: 12px;
  background: rgba(18, 18, 24, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0;
  z-index: 10000;
  font-family: monospace;
  font-size: 12px;
  min-width: 180px;
}

.debug-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #888;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.debug-header button {
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.debug-header button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.debug-content {
  padding: 8px 12px;
}

.debug-content label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: #ccc;
  font-size: 0.85em;
  padding: 4px 0;
}

.debug-content input[type="checkbox"] {
  accent-color: #42b983;
}

.debug-toggle-btn {
  position: fixed;
  bottom: 12px;
  left: 12px;
  width: 32px;
  height: 32px;
  background: rgba(28, 28, 36, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #666;
  font-family: monospace;
  font-size: 13px;
  cursor: pointer;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.debug-toggle-btn:hover {
  background: rgba(28, 28, 36, 0.95);
  color: #42b983;
  border-color: rgba(66, 185, 131, 0.3);
}
</style>
