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

    const toggleTileBounds = () => {
      showTileBounds.value = !showTileBounds.value;
      debugSettings.set('showTileBounds', showTileBounds.value);
      emit('setting-changed', 'showTileBounds', showTileBounds.value);
      
      // Для обратной совместимости с textureLoader
      window.dispatchEvent(new CustomEvent('debug-settings-changed', {
        detail: { showTileBounds: showTileBounds.value }
      }));
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
      toggleTileBounds
    };
  }
};
</script>

<style scoped>
/* Максимально простые стили без красот */
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background: white;
  border: 1px solid #ccc;
  padding: 0;
  z-index: 10000;
  font-family: monospace;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.debug-header {
  background: #f0f0f0;
  padding: 5px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ccc;
}

.debug-header button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  line-height: 18px;
}

.debug-content {
  padding: 10px;
}

.debug-content label {
  display: block;
  cursor: pointer;
  user-select: none;
  margin: 5px 0;
}

.debug-content input[type="checkbox"] {
  margin-right: 8px;
}

/* Простая кнопка открытия */
.debug-toggle-btn {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  font-family: monospace;
  font-size: 14px;
  cursor: pointer;
  z-index: 9999;
}

.debug-toggle-btn:hover {
  background: #e0e0e0;
}
</style>
