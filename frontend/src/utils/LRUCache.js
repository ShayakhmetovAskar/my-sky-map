export class LRUCache {
  constructor(capacity, onEvict) {
    if (capacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }
    this.capacity = capacity;
    this.cache = new Map();
    this.onEvict = onEvict; // Коллбек, вызываемый при удалении элемента
  }

  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const value = this.cache.get(key);
    // Обновляем порядок: удаляем и заново вставляем элемент, чтобы он стал самым «свежим»
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      // Если ключ уже существует, удаляем старое значение (без вызова коллбека, так как это обновление)
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Если кеш заполнен, удаляем наименее недавно использованный элемент (первый элемент Map)
      const oldestKey = this.cache.keys().next().value;
      const oldestValue = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      // Вызываем коллбек, если он передан
      if (this.onEvict) {
        this.onEvict(oldestKey, oldestValue);
      }
    }
    this.cache.set(key, value);
  }


  delete(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      // Вызываем коллбек, если он передан, чтобы сигнализировать о ручном удалении
      if (this.onEvict) {
        this.onEvict(key, value);
      }
      return true;
    }
    return false;
  }


  has(key) {
    return this.cache.has(key);
  }

  [Symbol.iterator]() {
    return this.cache[Symbol.iterator]();
  }
}

