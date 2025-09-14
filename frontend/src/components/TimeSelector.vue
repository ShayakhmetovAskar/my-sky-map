<template>
  <div class="time-slider disable-dbl-tap-zoom" :class="{ minimized }">
    <div v-if="!minimized" class="date-time">
      <div class="date">
        <button @mousedown="startTimeChange(24 * 60 * 60)" @mouseup="stopTimeChange" @mouseleave="stopTimeChange">
          ▲
        </button>
        <p>{{ formattedDate }}</p>
        <button @mousedown="startTimeChange(-24 * 60 * 60)" @mouseup="stopTimeChange" @mouseleave="stopTimeChange">
          ▼
        </button>
      </div>
      <div class="time">
        <button @mousedown="startTimeChange(60)" @mouseup="stopTimeChange" @mouseleave="stopTimeChange">
          ▲
        </button>
        <p>{{ formattedTime }}</p>
        <button @mousedown="startTimeChange(-60)" @mouseup="stopTimeChange" @mouseleave="stopTimeChange">
          ▼
        </button>
      </div>
    </div>
    <div v-else class="minimized-view" @click="toggleMinimized">
      <p>{{ formattedDate }} {{ formattedTime }}</p>
    </div>
    <div v-if="!minimized" class="controls">
      <button @click="decreaseMultiplier">&lt;&lt;</button>
      <span>{{ multiplier }}x</span>
      <button @click="increaseMultiplier">&gt;&gt;</button>
      <button @click="togglePlayPause">{{ isPlaying ? '❚❚' : '▶' }}</button>
      <button @click="resetTime">⟲</button>
    </div>
    <div v-if="!minimized" class="slider">
      <input type="range" min="0" max="86340" step="1" v-model="sliderValue" @input="updateTimeFromSlider" />
    </div>
    <button class="toggle-button" @click="toggleMinimized">
      {{ minimized ? '▲' : '▼' }}
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentDate: new Date(),
      sliderValue: 0,
      isPlaying: true,
      playTimeout: null, // заменили playInterval на playTimeout
      minimized: true,
      multiplier: 1, // множитель скорости времени, не может быть меньше 1
    };
  },
  computed: {
    formattedDate() {
      return this.currentDate.toLocaleDateString();
    },
    formattedTime() {
      const hours = this.currentDate.getHours().toString().padStart(2, "0");
      const minutes = this.currentDate.getMinutes().toString().padStart(2, "0");
      const seconds = this.currentDate.getSeconds().toString().padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    },
  },
  methods: {
    startTimeChange(seconds) {
      this.stopTimeChange();
      this.changeTime(seconds);

      let interval = 300;
      this.holdInterval = setInterval(() => {
        this.changeTime(seconds);
      }, interval);
    },
    stopTimeChange() {
      if (this.holdInterval) {
        clearInterval(this.holdInterval);
        this.holdInterval = null;
      }
    },
    changeDate(days) {
      const newDate = new Date(this.currentDate);
      newDate.setDate(this.currentDate.getDate() + days);
      this.currentDate = newDate;
      this.emitTimeChange();
    },
    changeTime(seconds) {
      const newDate = new Date(this.currentDate.getTime() + seconds * 1000);
      this.currentDate = newDate;
      this.syncSliderWithTime();
      this.emitTimeChange();
    },
    togglePlayPause() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    },
    resetTime() {
      this.currentDate = new Date();
      this.syncSliderWithTime();
      this.emitTimeChange();
    },
    syncSliderWithTime() {
      const secondsSinceMidnight =
        this.currentDate.getHours() * 3600 +
        this.currentDate.getMinutes() * 60 +
        this.currentDate.getSeconds();
      this.sliderValue = secondsSinceMidnight;
    },
    updateTimeFromSlider() {
      const hours = Math.floor(this.sliderValue / 3600);
      const minutes = Math.floor((this.sliderValue % 3600) / 60);
      const seconds = this.sliderValue % 60;

      const newDate = new Date(this.currentDate);
      newDate.setHours(hours, minutes, seconds);
      this.currentDate = newDate;

      this.emitTimeChange();
    },
    emitTimeChange() {
      this.$emit("time-changed", this.currentDate);
    },
    startTimer() {
      if (this.playTimeout) return;
      const tick = () => {
        if (!this.isPlaying) return;
        // Вычисляем интервал: при multiplier=1 интервал будет 1000 мс,
        // а чем больше multiplier, тем меньше интервал, но не менее 50 мс
        const tickInterval = Math.max(10, 1000 / this.multiplier);
        // При каждом тике прибавляем multiplier * (tickInterval/1000) секунд.
        // За одну секунду (1000 мс) суммарно прибавится multiplier секунд.
        this.changeTime(this.multiplier * (tickInterval / 1000));
        this.playTimeout = setTimeout(tick, tickInterval);
      };
      tick();
    },
    stopTimer() {
      this.isPlaying = false;
      clearInterval(this.playInterval);
      this.playTimeout = null;
    },
    toggleMinimized() {
      this.minimized = !this.minimized;
    },
    increaseMultiplier() {
      // Умножаем множитель на 10
      this.multiplier = Math.round(this.multiplier * 10 * 100) / 100;
      this.multiplier = Math.min(this.multiplier, 10000000);
    },
    decreaseMultiplier() {
      // Делим множитель на 10, но не опускаем его ниже 1
      const newMultiplier = this.multiplier / 10;
      this.multiplier = Math.max(1, Math.round(newMultiplier * 100) / 100);
    },
  },
  mounted() {
    this.syncSliderWithTime();
    if (this.isPlaying) {
      this.startTimer(); // запускаем таймер при монтировании
    }
    window.addEventListener("mouseup", this.stopTimeChange);
    this.$emit('ready');
  },
  beforeDestroy() {
    this.stopTimer();
    this.stopTimeChange();
    window.removeEventListener("mouseup", this.stopTimeChange);
  },
};
</script>

<style scoped>
.time-slider {
  background: rgba(28, 28, 36, 0.95);
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  max-width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.date-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.date,
.time {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.date p,
.time p {
  font-size: 1.1em;
  font-weight: 500;
  margin: 8px 0;
  letter-spacing: 0.5px;
}

button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  margin: 2px 0;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
}

button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 8px;
}

.controls span {
  font-size: 0.9em;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
}

input[type="range"] {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.toggle-button {
  align-self: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 16px;
  border-radius: 4px;
  font-size: 14px;
}

.minimized {
  max-width: 200px;
  padding: 10px;
}

.minimized-view {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.minimized-view:hover {
  background: rgba(255, 255, 255, 0.1);
}

.minimized-view p {
  margin: 0;
  font-size: 0.9em;
  font-weight: 500;
}
</style>
