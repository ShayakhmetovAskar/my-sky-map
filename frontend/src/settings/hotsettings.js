// Система горячих настроек для разработки (только boolean флаги)
// Используйте hotSettings.get('flagName') для получения значения флага
// Используйте hotSettings.set('flagName', true/false) для установки значения

class HotSettings {
  constructor() {
    // Определение доступных флагов с их значениями по умолчанию
    this.flags = {
      flag1: false,
      show_tile_bounds: false,
    }

    // Метаданные для каждого флага (описание, категория)
    this.metadata = {
      flag1: { 
        name: 'Flag 1', 
        description: 'Первый флаг',
        category: 'debug'
      },
      show_tile_bounds: { 
        name: 'Show Tile Bounds', 
        description: 'Показать белые границы тайлов по периметру',
        category: 'debug'
      },
    }

    // Слушатели изменений
    this.listeners = new Map()
  }

  /**
   * Получить значение флага
   * @param {string} flagName - название флага
   * @returns {boolean} значение флага
   */
  get(flagName) {
    if (!(flagName in this.flags)) {
      console.warn(`HotSettings: Unknown flag '${flagName}'`)
      return false
    }
    return this.flags[flagName]
  }

  /**
   * Установить значение флага
   * @param {string} flagName - название флага
   * @param {boolean} value - новое значение (только true/false)
   */
  set(flagName, value) {
    if (!(flagName in this.flags)) {
      console.warn(`HotSettings: Unknown flag '${flagName}'`)
      return
    }

    if (typeof value !== 'boolean') {
      console.warn(`HotSettings: Value for '${flagName}' must be boolean, got ${typeof value}`)
      return
    }
    
    const oldValue = this.flags[flagName]
    this.flags[flagName] = value
    
    // Уведомляем слушателей
    this.notifyListeners(flagName, value, oldValue)
  }

  /**
   * Переключить флаг (toggle)
   * @param {string} flagName - название флага
   */
  toggle(flagName) {
    if (!(flagName in this.flags)) {
      console.warn(`HotSettings: Unknown flag '${flagName}'`)
      return
    }
    
    this.set(flagName, !this.flags[flagName])
  }

  /**
   * Включить флаг (установить в true)
   * @param {string} flagName - название флага
   */
  enable(flagName) {
    this.set(flagName, true)
  }

  /**
   * Выключить флаг (установить в false)
   * @param {string} flagName - название флага
   */
  disable(flagName) {
    this.set(flagName, false)
  }

  /**
   * Получить все флаги определенной категории
   * @param {string} category - категория
   * @returns {Object} объект с флагами категории
   */
  getCategory(category) {
    const categoryFlags = {}
    for (const [flagName, metadata] of Object.entries(this.metadata)) {
      if (metadata.category === category) {
        categoryFlags[flagName] = {
          value: this.flags[flagName],
          ...metadata
        }
      }
    }
    return categoryFlags
  }

  /**
   * Получить все доступные категории
   * @returns {string[]} массив названий категорий
   */
  getCategories() {
    const categories = new Set()
    for (const metadata of Object.values(this.metadata)) {
      categories.add(metadata.category)
    }
    return Array.from(categories)
  }

  /**
   * Сбросить все флаги к значениям по умолчанию
   */
  resetToDefaults() {
    // Получаем изначальные значения (можно вынести в отдельную конфигурацию)
    const defaults = {
      flag1: false,
      show_tile_bounds: false,
    }

    for (const [flagName, defaultValue] of Object.entries(defaults)) {
      this.set(flagName, defaultValue)
    }
  }

  /**
   * Подписаться на изменения флага
   * @param {string} flagName - название флага
   * @param {Function} callback - функция обратного вызова (flagName, newValue, oldValue) => void
   */
  onChange(flagName, callback) {
    if (!this.listeners.has(flagName)) {
      this.listeners.set(flagName, [])
    }
    this.listeners.get(flagName).push(callback)
  }

  /**
   * Отписаться от изменений флага
   * @param {string} flagName - название флага
   * @param {Function} callback - функция обратного вызова
   */
  offChange(flagName, callback) {
    if (this.listeners.has(flagName)) {
      const callbacks = this.listeners.get(flagName)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Уведомить всех слушателей об изменении
   * @private
   */
  notifyListeners(flagName, newValue, oldValue) {
    if (this.listeners.has(flagName)) {
      this.listeners.get(flagName).forEach(callback => {
        try {
          callback(flagName, newValue, oldValue)
        } catch (error) {
          console.error(`HotSettings listener error for '${flagName}':`, error)
        }
      })
    }
  }

}

// Создаем глобальный экземпляр
const hotSettings = new HotSettings()

// Экспортируем для использования в коде
export default hotSettings

// Для удобства отладки в консоли
if (typeof window !== 'undefined') {
  window.hotSettings = hotSettings
}
