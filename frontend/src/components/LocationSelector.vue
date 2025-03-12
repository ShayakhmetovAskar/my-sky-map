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
    background: #333;
    color: #fff;
    font-size: 18px;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    transition: background 0.2s;
}

.location-button:hover {
    background: #555;
}

/* Затемнение фона при открытом модальном окне */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    /* полупрозрачный фон */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

/* Сама карточка с вводом */
.location-modal {
    background: #2b2b2b;
    border-radius: 10px;
    padding: 20px;
    width: 300px;
    max-width: 90%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

.modal-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
    color: #fff;
    font-family: Arial, sans-serif;
}

h2 {
    margin: 0;
    font-size: 20px;
    text-align: center;
}

.coords-inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.coords-inputs label {
    display: flex;
    flex-direction: column;
    font-size: 14px;
}

/* Кнопки внутри модального окна */
.modal-buttons {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.modal-buttons button {
    flex: 1;
    background: #444;
    color: #fff;
    border: none;
    cursor: pointer;
    padding: 8px 10px;
    transition: background 0.2s;
    border-radius: 5px;
}

.modal-buttons button:hover {
    background: #666;
}

input[type="number"] {
    margin-top: 5px;
    border-radius: 4px;
    border: 1px solid #555;
    padding: 5px;
    background: #1e1e1e;
    color: #fff;
}
</style>
