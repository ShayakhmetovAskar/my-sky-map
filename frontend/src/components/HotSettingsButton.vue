<template>
  <button 
    class="hotsettings-button"
    @click="toggleMenu"
    :class="{ active: isMenuOpen }"
    title="Hot Settings"
  >
    ⚙️
  </button>
</template>

<script>
export default {
  name: 'HotSettingsButton',
  emits: ['toggle-menu'],
  props: {
    isMenuOpen: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const toggleMenu = () => {
      emit('toggle-menu')
    }

    return {
      toggleMenu
    }
  }
}
</script>

<style scoped>
.hotsettings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(28, 28, 36, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  font-size: 20px;
}

.hotsettings-button:hover {
  background: rgba(48, 48, 56, 0.95);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.hotsettings-button.active {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.hotsettings-button.active:hover {
  background: rgba(76, 175, 80, 0.3);
}
</style>

