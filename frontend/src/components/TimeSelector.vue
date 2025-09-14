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
  background: #2b2b2b;
  color: #fff;
  padding: 20px;
  border-radius: 10px;
  max-width: 300px;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.date-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.date,
.time {
  display: flex;
  flex-direction: column;
  align-items: center;
}

button {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  margin: 5px 0;
}

button:hover {
  color: #00f;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  align-items: center;
}

.slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

input[type="range"] {
  width: 100%;
}

p {
  margin: 0;
}
</style>
