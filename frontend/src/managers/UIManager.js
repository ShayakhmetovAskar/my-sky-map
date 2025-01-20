// src/managers/UIManager.js

/**
 * UIManager отвечает за интерфейс: HUD и TimeSelector
 */
export default class UIManager {
    /**
     * @param {HTMLElement} hudElement      - DOM-элемент, куда выводим HUD (например, <pre id="fovValue">)
     */
    constructor(hudElement) {
      this.hudElement = hudElement;
  
      // Callback, который вызываем при изменении даты/времени
      this.onTimeChangedCallback = null;
  
      // Инициализируем HUD и события
      this._initHUD();
    }
  
    /**
     * Инициализация HUD (если что-то нужно сделать один раз, например стили, первоначальный текст)
     */
    _initHUD() {
      if (this.hudElement) {
        this.hudElement.textContent = 'HUD ready...';
      }
    }
  
    
  
  
    /**
     * Позволяет извне назначить колбэк, который будет вызываться при смене даты/времени
     * @param {Function} callback - (newDate: Date) => void
     */
    setOnTimeChangedCallback(callback) {
      this.onTimeChangedCallback = callback;
    }
  
    /**
     * Обновляет HUD текст (например, о FOV, координатах и т.д.)
     * @param {string} text 
     */
    updateHUD(text) {
      if (this.hudElement) {
        this.hudElement.textContent = text;
      }
    }
  
    /**
     * Очистка ресурсов, например, снятие слушателей
     */
    dispose() {
      
    }
  }
  