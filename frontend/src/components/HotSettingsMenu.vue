<template>
  <div v-if="isVisible" class="hotsettings-overlay" @click="close">
    <div class="hotsettings-menu" @click.stop>
      <div class="menu-header">
        <h3>Hot Settings</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="menu-content">
        <div 
          v-for="category in categories" 
          :key="category"
          class="category-section"
        >
          <h4 class="category-title">{{ getCategoryTitle(category) }}</h4>
          <div class="flags-list">
            <div 
              v-for="[flagName, flagData] in Object.entries(categoryFlags[category])" 
              :key="flagName"
              class="flag-item"
            >
              <label class="flag-label">
                <input 
                  type="checkbox" 
                  :checked="flagData.value" 
                  @change="toggleFlag(flagName, $event.target.checked)"
                />
                <span class="checkmark"></span>
                <div class="flag-info">
                  <span class="flag-name">{{ flagData.name }}</span>
                  <span class="flag-description">{{ flagData.description }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-actions">
        <button class="reset-btn" @click="resetAll">Сбросить все</button>
        <button class="close-btn-action" @click="close">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import hotSettings from '@/settings/hotsettings.js'

export default {
  name: 'HotSettingsMenu',
  emits: ['close'],
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const categories = ref([])
    const categoryFlags = reactive({})

    const categoryTitles = {
      debug: '🐛 Отладка',
      performance: '⚡ Производительность', 
      development: '🔧 Разработка',
      visualization: '👁️ Визуализация',
      experimental: '🧪 Экспериментальные'
    }

    const getCategoryTitle = (category) => {
      return categoryTitles[category] || category
    }

    const loadCategories = () => {
      categories.value = hotSettings.getCategories()
      
      // Загружаем флаги для каждой категории
      categories.value.forEach(category => {
        categoryFlags[category] = hotSettings.getCategory(category)
      })
    }

    const toggleFlag = (flagName, value) => {
      hotSettings.set(flagName, value)
      // Обновляем локальное состояние
      for (const category of categories.value) {
        if (categoryFlags[category][flagName]) {
          categoryFlags[category][flagName].value = value
          break
        }
      }
    }

    const resetAll = () => {
      hotSettings.resetToDefaults()
      // Перезагружаем данные
      loadCategories()
    }

    const close = () => {
      emit('close')
    }

    onMounted(() => {
      loadCategories()
    })

    return {
      categories,
      categoryFlags,
      getCategoryTitle,
      toggleFlag,
      resetAll,
      close
    }
  }
}
</script>

<style scoped>
.hotsettings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.hotsettings-menu {
  background: rgba(28, 28, 36, 0.98);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  min-width: 450px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 24px;
}

.category-section:last-child {
  margin-bottom: 0;
}

.category-title {
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.flags-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flag-item {
  padding: 2px 0;
}

.flag-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.flag-label:hover {
  background: rgba(255, 255, 255, 0.05);
}

.flag-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 1px;
}

.flag-label input[type="checkbox"]:checked + .checkmark {
  background: #4CAF50;
  border-color: #4CAF50;
}

.flag-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.flag-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flag-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
}

.flag-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
}

.menu-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.reset-btn,
.close-btn-action {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover,
.close-btn-action:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.close-btn-action {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.close-btn-action:hover {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.7);
}

/* Скроллбар */
.hotsettings-menu::-webkit-scrollbar,
.menu-content::-webkit-scrollbar {
  width: 6px;
}

.hotsettings-menu::-webkit-scrollbar-track,
.menu-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.hotsettings-menu::-webkit-scrollbar-thumb,
.menu-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.hotsettings-menu::-webkit-scrollbar-thumb:hover,
.menu-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>

