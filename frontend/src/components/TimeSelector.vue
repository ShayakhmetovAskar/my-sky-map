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
      //currentDate: new Date(new Date().setDate(new Date().getDate() + 14)),
      currentDate: new Date(),
      sliderValue: 0,
      isPlaying: true,
      playInterval: null,
      minimized: true,
    };
  },
  computed: {
    formattedDate() {
      return this.currentDate.toISOString().split("T")[0];
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
      const newDate = new Date(this.currentDate);
      newDate.setSeconds(this.currentDate.getSeconds() + seconds);
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
      if (this.playInterval) return;
      this.playInterval = setInterval(() => {
        this.changeTime(1); // Увеличиваем время на 1 секунду каждую секунду
      }, 1000);
    },
    stopTimer() {
      clearInterval(this.playInterval);
      this.playInterval = null;
    },
    toggleMinimized() {
      this.minimized = !this.minimized;
    },
  },
  mounted() {
    this.syncSliderWithTime();
    if (this.isPlaying) {
      this.startTimer(); // Запускаем таймер при монтировании
    }
    window.addEventListener("mouseup", this.stopTimeChange);
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
