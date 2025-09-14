<!-- LocationSelector.vue -->
<template>
    <div class="location-selector">
        <button class="location-button" @click="toggleModal">📍</button>

        <div v-if="showModal" class="modal-overlay" @click.self="toggleModal">
            <div class="location-modal">
                <div class="modal-content">
                    <h2>Выбрать локацию</h2>

                    <div class="coords-inputs">
                        <label>
                            Широта:
                            <input v-model="latitude" type="number" step="0.0001" />
                        </label>
                        <label>
                            Долгота:
                            <input v-model="longitude" type="number" step="0.0001" />
                        </label>
                    </div>

                    <div class="modal-buttons">
                        <button @click="useGPS">GPS</button>
                        <button @click="applyLocation">Применить</button>
                        <button @click="toggleModal">Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LocationSelector',
    data() {
        return {
            showModal: false,
            latitude: 59.9343,
            longitude: 30.3351,
        };
    },
    methods: {
        toggleModal() {
            this.showModal = !this.showModal;
        },
        useGPS() {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    this.latitude = pos.coords.latitude;
                    this.longitude = pos.coords.longitude;
                });
            } else {
                alert('GPS не поддерживается');
            }
        },
        applyLocation() {
            this.$emit('location-changed', {
                latitude: parseFloat(this.latitude),
                longitude: parseFloat(this.longitude),
            });
            this.toggleModal();
        },
    },
};
</script>

<style scoped>
/* Базовая обертка */
.location-selector {
    position: relative;
}

/* Кнопка */
.location-button {
    cursor: pointer;
    background: rgba(28, 28, 36, 0.95);
    color: #fff;
    font-size: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.location-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
}

/* Затемнение фона при открытом модальном окне */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

/* Сама карточка с вводом */
.location-modal {
    background: rgba(28, 28, 36, 0.95);
    border-radius: 12px;
    padding: 24px;
    width: 320px;
    max-width: 90%;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transform: scale(1);
    transition: transform 0.3s ease;
}

.modal-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h2 {
    margin: 0;
    font-size: 1.2em;
    font-weight: 500;
    text-align: center;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.9);
}

.coords-inputs {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: rgba(255, 255, 255, 0.05);
    padding: 16px;
    border-radius: 8px;
}

.coords-inputs label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.9em;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
}

/* Кнопки внутри модального окна */
.modal-buttons {
    display: flex;
    justify-content: space-between;
    gap: 12px;
}

.modal-buttons button {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: none;
    cursor: pointer;
    padding: 10px;
    transition: all 0.2s ease;
    border-radius: 8px;
    font-size: 0.9em;
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-buttons button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

input[type="number"] {
    margin-top: 2px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
    color: #fff;
    font-size: 1em;
    transition: all 0.2s ease;
}

input[type="number"]:focus {
    border-color: rgba(255, 255, 255, 0.3);
    outline: none;
    background: rgba(0, 0, 0, 0.3);
}
</style>
