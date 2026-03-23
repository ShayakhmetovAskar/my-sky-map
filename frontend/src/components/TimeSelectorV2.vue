<template>
  <div class="bottom-bar disable-dbl-tap-zoom">
    <!-- View toggles -->
    <div class="view-toggles">
      <button class="icon-btn" :class="{ active: groundOn }" @click="$emit('toggle-terrain')" title="Ground">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l4-4 4 4 4-6 6 6"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
      </button>
      <button class="icon-btn" :class="{ active: trackingOn }" @click="$emit('toggle-tracking')" title="Lock tracking">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>
      </button>
    </div>

    <div class="divider"></div>

    <!-- Date/Time segments -->
    <div class="segments">
      <div class="segment" v-for="seg in segments" :key="seg.key" :class="{ time: seg.isTime }">
        <button class="seg-btn" @mousedown="startChange(seg.key, 1)" @mouseup="stopChange" @mouseleave="stopChange" @touchstart.prevent="startChange(seg.key, 1)" @touchend="stopChange">▲</button>
        <span class="seg-value">{{ seg.display }}</span>
        <button class="seg-btn" @mousedown="startChange(seg.key, -1)" @mouseup="stopChange" @mouseleave="stopChange" @touchstart.prevent="startChange(seg.key, -1)" @touchend="stopChange">▼</button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Day slider -->
    <div class="day-slider">
      <input type="range" min="0" max="86340" step="60" :value="sliderValue" @input="onSlider($event.target.value)" />
    </div>

    <div class="divider"></div>

    <!-- Playback -->
    <div class="playback">
      <button class="pb-btn" @click="decreaseSpeed" title="Slower">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12L5 4v16l12-8z" transform="rotate(180 12 12)"/><rect x="18" y="5" width="3" height="14"/></svg>
      </button>
      <button class="pb-btn play" @click="togglePlay">
        <svg v-if="isPlaying" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button class="pb-btn" @click="increaseSpeed" title="Faster">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 12L7 4v16l12-8z"/><rect x="3" y="5" width="3" height="14"/></svg>
      </button>
      <span class="speed-label">{{ speedLabel }}</span>
      <button class="pb-btn" @click="resetNow" title="Now">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    ground: { type: Boolean, default: true },
    tracking: { type: Boolean, default: false },
  },
  data() {
    return {
      currentDate: new Date(),
      isPlaying: true,
      multiplier: 1,
      playTimeout: null,
      holdInterval: null,
      lastBaseTime: null,
      accumulatedTime: 0,
      groundOn: this.ground,
      trackingOn: this.tracking,
    }
  },
  computed: {
    segments() {
      const d = this.currentDate
      return [
        { key: 'year', display: d.getFullYear().toString(), isTime: false },
        { key: 'month', display: (d.getMonth() + 1).toString().padStart(2, '0'), isTime: false },
        { key: 'day', display: d.getDate().toString().padStart(2, '0'), isTime: false },
        { key: 'hour', display: d.getHours().toString().padStart(2, '0'), isTime: true },
        { key: 'minute', display: d.getMinutes().toString().padStart(2, '0'), isTime: true },
        { key: 'second', display: d.getSeconds().toString().padStart(2, '0'), isTime: true },
      ]
    },
    sliderValue() {
      return this.currentDate.getHours() * 3600 + this.currentDate.getMinutes() * 60 + this.currentDate.getSeconds()
    },
    speedLabel() {
      const m = this.multiplier
      if (m >= 31536000) return `${(m / 31536000).toFixed(0)}y/s`
      if (m >= 2592000) return `${(m / 2592000).toFixed(0)}mo/s`
      if (m >= 604800) return `${(m / 604800).toFixed(0)}w/s`
      if (m >= 86400) return `${(m / 86400).toFixed(0)}d/s`
      if (m >= 3600) return `${(m / 3600).toFixed(0)}h/s`
      if (m >= 60) return `${(m / 60).toFixed(0)}m/s`
      return `${m}x`
    },
  },
  watch: {
    ground(v) { this.groundOn = v },
    tracking(v) { this.trackingOn = v },
  },
  methods: {
    changeSegment(key, dir) {
      const d = new Date(this.currentDate)
      switch (key) {
        case 'year': d.setFullYear(d.getFullYear() + dir); break
        case 'month': d.setMonth(d.getMonth() + dir); break
        case 'day': d.setDate(d.getDate() + dir); break
        case 'hour': d.setHours(d.getHours() + dir); break
        case 'minute': d.setMinutes(d.getMinutes() + dir); break
        case 'second': d.setSeconds(d.getSeconds() + dir); break
      }
      this.currentDate = d
      this.$emit('time-changed', this.currentDate)
    },
    startChange(key, dir) {
      this.stopChange()
      this.changeSegment(key, dir)
      this.holdInterval = setInterval(() => this.changeSegment(key, dir), 150)
    },
    stopChange() {
      if (this.holdInterval) { clearInterval(this.holdInterval); this.holdInterval = null }
    },
    onSlider(val) {
      const v = parseInt(val)
      const d = new Date(this.currentDate)
      d.setHours(Math.floor(v / 3600), Math.floor((v % 3600) / 60), v % 60)
      this.currentDate = d
      this.$emit('time-changed', this.currentDate)
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying
      if (this.isPlaying) this.startTimer()
      else this.stopTimer()
    },
    increaseSpeed() {
      const steps = [1, 2, 5, 10, 30, 60, 300, 600, 3600, 7200, 86400, 604800, 2592000, 31536000]
      const idx = steps.findIndex(s => s > this.multiplier)
      this.multiplier = idx >= 0 ? steps[idx] : steps[steps.length - 1]
    },
    decreaseSpeed() {
      const steps = [1, 2, 5, 10, 30, 60, 300, 600, 3600, 7200, 86400, 604800, 2592000, 31536000]
      const idx = [...steps].reverse().findIndex(s => s < this.multiplier)
      this.multiplier = idx >= 0 ? [...steps].reverse()[idx] : 1
    },
    resetNow() {
      this.currentDate = new Date()
      this.$emit('time-changed', this.currentDate)
    },
    startTimer() {
      if (this.playTimeout) return
      const tick = () => {
        if (!this.isPlaying) return
        const interval = Math.max(10, 1000 / Math.min(this.multiplier, 100))
        const seconds = this.multiplier * (interval / 1000)
        this.currentDate = new Date(this.currentDate.getTime() + seconds * 1000)
        this.$emit('time-changed', this.currentDate)
        this.playTimeout = setTimeout(tick, interval)
      }
      tick()
    },
    stopTimer() {
      this.isPlaying = false
      if (this.playTimeout) { clearTimeout(this.playTimeout); this.playTimeout = null }
    },
    getSmoothTime(deltaTime) {
      const baseTime = this.currentDate
      if (!this.lastBaseTime || this.lastBaseTime.getTime() !== baseTime.getTime()) {
        this.lastBaseTime = new Date(baseTime)
        this.accumulatedTime = 0
      }
      if (this.isPlaying) this.accumulatedTime += deltaTime * this.multiplier
      return new Date(this.lastBaseTime.getTime() + this.accumulatedTime * 1000)
    },
  },
  mounted() {
    if (this.isPlaying) this.startTimer()
    window.addEventListener('mouseup', this.stopChange)
    this.$emit('ready')
  },
  beforeDestroy() {
    this.stopTimer()
    this.stopChange()
    window.removeEventListener('mouseup', this.stopChange)
  },
}
</script>

<style scoped>
.bottom-bar {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(12, 12, 18, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.divider {
  width: 1px;
  height: 28px;
  background: rgba(255, 255, 255, 0.12);
}

/* View toggles */
.view-toggles {
  display: flex;
  gap: 2px;
}

.icon-btn {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-btn:hover { color: #aaa; background: rgba(255,255,255,0.06); }
.icon-btn.active { color: #42b983; }

/* Segments */
.segments {
  display: flex;
  gap: 1px;
  align-items: center;
}

.segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 28px;
}

.segment:nth-child(3) { margin-right: 8px; }

.seg-value {
  font-size: 1.05em;
  font-weight: 600;
  padding: 1px 0;
  color: #d0d0d0;
  user-select: none;
}

.segment.time .seg-value { color: #42b983; }

.seg-btn {
  background: none;
  border: none;
  color: #444;
  font-size: 7px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.1s;
}

.seg-btn:hover { color: #aaa; }

/* Day slider */
.day-slider {
  width: 80px;
}

.day-slider input[type="range"] {
  width: 100%;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
}

.day-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #42b983;
  border-radius: 50%;
  cursor: pointer;
}

/* Playback */
.playback {
  display: flex;
  align-items: center;
  gap: 3px;
}

.pb-btn {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px 7px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.pb-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

.pb-btn.play {
  background: rgba(66, 185, 131, 0.15);
  color: #42b983;
  padding: 5px 9px;
}

.pb-btn.play:hover { background: rgba(66, 185, 131, 0.3); }

.speed-label {
  font-size: 0.7em;
  color: #666;
  min-width: 32px;
  text-align: center;
  user-select: none;
}
</style>
