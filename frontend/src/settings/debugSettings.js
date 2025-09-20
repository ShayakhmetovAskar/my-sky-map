// Простая система дебаг-флагов с localStorage
class DebugSettings {
  constructor() {
    this.storageKey = 'debug-settings';
    this.flags = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : { showTileBounds: false };
    } catch (e) {
      console.error('Failed to load debug settings:', e);
      return { showTileBounds: false };
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
    } catch (e) {
      console.error('Failed to save debug settings:', e);
    }
  }

  get(key) {
    return this.flags[key] ?? false;
  }

  set(key, value) {
    this.flags[key] = value;
    this.saveToStorage();
  }

  toggle(key) {
    this.set(key, !this.get(key));
  }
}

// Создаем глобальный экземпляр
const debugSettings = new DebugSettings();

// Экспортируем для использования
export default debugSettings;

// Для консоли
if (typeof window !== 'undefined') {
  window.debugSettings = debugSettings;
  console.log('Debug settings available: window.debugSettings');
}
