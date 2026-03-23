<template>
  <div id="app">
    <div v-if="showAuthBar" class="auth-bar">
      <div class="nav-links">
        <router-link to="/" class="auth-link">Sky Map</router-link>
        <template v-if="isAuthenticated">
          <router-link to="/submissions" class="auth-link">My Submissions</router-link>
          <router-link to="/solve" class="auth-link">Solve New</router-link>
        </template>
      </div>
      <div class="auth-right">
        <template v-if="isAuthenticated">
          <div class="user-menu" @click="showMenu = !showMenu" @mouseleave="showMenu = false">
            <span class="auth-user">{{ displayName }}</span>
            <span class="caret">▾</span>
            <div v-if="showMenu" class="dropdown">
              <button @click="doLogout">Logout</button>
            </div>
          </div>
        </template>
        <template v-else>
          <button class="auth-btn" @click="login">Login</button>
        </template>
      </div>
    </div>
    <router-view v-slot="{ Component }">
      <keep-alive exclude="Scene">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { AUTH_CONFIG } from '@/settings/auth'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, user, login, logout, handleCallback, initAuth } = useAuth()

const showMenu = ref(false)
const showAuthBar = computed(() => true)
const displayName = computed(() => user.value?.name || 'User')

function doLogout() {
  showMenu.value = false
  logout()
  // Redirect to Zitadel end_session for full logout
  const endSessionUrl = `${AUTH_CONFIG.zitadelUrl}/oidc/v1/end_session?post_logout_redirect_uri=${encodeURIComponent(window.location.origin + '/')}`
  window.location.href = endSessionUrl
}

onMounted(async () => {
  initAuth()

  const params = new URLSearchParams(window.location.search)
  if (params.has('code')) {
    const success = await handleCallback(params.get('code'), params.get('state'))
    history.replaceState({}, '', window.location.pathname)

    if (success) {
      const redirect = sessionStorage.getItem('auth_redirect')
      sessionStorage.removeItem('auth_redirect')
      if (redirect) {
        router.push(redirect)
      }
    }
  }
})
</script>

<style>
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.auth-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-links {
  display: flex;
  gap: 4px;
}

.auth-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.auth-link {
  color: #aaa;
  text-decoration: none;
  font-size: 0.85em;
  padding: 4px 10px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.auth-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.auth-link.router-link-active {
  color: #42b983;
}

.user-menu {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  transition: background 0.15s;
}

.user-menu:hover {
  background: rgba(255, 255, 255, 0.08);
}

.auth-user {
  color: #ccc;
  font-size: 0.85em;
}

.caret {
  color: #888;
  font-size: 0.7em;
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: rgba(28, 28, 36, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  overflow: hidden;
  min-width: 120px;
}

.dropdown button {
  width: 100%;
  padding: 8px 16px;
  background: none;
  color: #ccc;
  border: none;
  font-size: 0.85em;
  cursor: pointer;
  text-align: left;
}

.dropdown button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.auth-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.auth-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
