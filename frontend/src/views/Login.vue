<template>
    <div class="login-page">
        <div class="login-card">
            <h1 class="login-title">Welcome to Skymap</h1>
            <p class="login-subtitle">Sign in to continue or try it as a guest</p>

            <div class="login-buttons">
                <button class="login-btn primary" @click="doLogin">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Sign in
                </button>

                <button class="login-btn guest" @click="doGuest" :disabled="guestLoading">
                    <svg v-if="!guestLoading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span v-if="guestLoading" class="spinner"></span>
                    {{ guestLoading ? 'Creating guest...' : 'Continue as Guest' }}
                </button>
            </div>

            <p v-if="error" class="login-error">{{ error }}</p>

            <p class="login-note">
                Guest sessions persist on this device but data may be deleted after 30 days of inactivity.
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { login, loginAsGuest } = useAuth()

const guestLoading = ref(false)
const error = ref(null)

function getRedirect() {
    return route.query.redirect || '/'
}

function doLogin() {
    sessionStorage.setItem('auth_redirect', getRedirect())
    login()
}

async function doGuest() {
    guestLoading.value = true
    error.value = null
    try {
        const ok = await loginAsGuest()
        if (ok) {
            router.push(getRedirect())
        } else {
            error.value = 'Failed to create guest session. Please try again.'
        }
    } catch (err) {
        error.value = 'Guest login error: ' + err.message
    } finally {
        guestLoading.value = false
    }
}
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.login-card {
    max-width: 420px;
    width: 100%;
    padding: 2.5rem 2rem;
    background: rgba(18, 18, 24, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    backdrop-filter: blur(16px);
    text-align: center;
}

.login-title {
    color: #fff;
    font-size: 1.6em;
    margin: 0 0 0.5rem;
}

.login-subtitle {
    color: #888;
    font-size: 0.9em;
    margin: 0 0 2rem;
}

.login-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 1.5rem;
}

.login-btn {
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.login-btn.primary {
    background: #42b983;
    color: #fff;
    border-color: #42b983;
}

.login-btn.primary:hover {
    background: #38a375;
    transform: translateY(-1px);
}

.login-btn.guest {
    background: rgba(255, 255, 255, 0.06);
    color: #ccc;
}

.login-btn.guest:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
}

.login-btn.guest:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

.login-error {
    color: #f44336;
    font-size: 0.85em;
    margin: 0 0 1rem;
    padding: 10px 14px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.2);
    border-radius: 8px;
}

.login-note {
    color: #666;
    font-size: 0.75em;
    margin: 0;
    line-height: 1.5;
}
</style>
