<template>
  <div id="app">
    <div v-if="showAuthBar" class="auth-bar">
      <template v-if="isAuthenticated">
        <router-link to="/submissions" class="auth-link">My Submissions</router-link>
        <router-link to="/solve" class="auth-link">Solve</router-link>
        <span class="auth-user">{{ user?.name }}</span>
        <button class="auth-btn" @click="logout">Logout</button>
      </template>
      <template v-else>
        <button class="auth-btn" @click="login">Login</button>
      </template>
    </div>
    <router-view v-slot="{ Component }">
      <keep-alive exclude="Scene">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, user, login, logout, handleCallback, initAuth } = useAuth()

const showAuthBar = computed(() => route.name !== 'Scene' && route.name !== 'SceneDisplay')

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
  right: 0;
  z-index: 1000;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.auth-link {
  color: #aaa;
  text-decoration: none;
  font-size: 0.85em;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.15s;
}

.auth-link:hover {
  color: #fff;
}

.auth-link.router-link-active {
  color: #42b983;
}

.auth-user {
  color: #ccc;
  font-size: 13px;
  font-family: monospace;
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
