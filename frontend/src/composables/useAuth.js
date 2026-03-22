import { ref, readonly } from 'vue'
import { AUTH_CONFIG } from '@/settings/auth'

const TOKEN_KEY = 'skymap_access_token'
const TOKEN_EXP_KEY = 'skymap_token_exp'

const isAuthenticated = ref(false)
const user = ref(null)

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateCodeVerifier() {
  const arr = new Uint8Array(96)
  crypto.getRandomValues(arr)
  return base64urlEncode(arr)
}

async function generateCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return base64urlEncode(digest)
}

function decodeJwtPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

// ─── Token management ────────────────────────────────────────────────────────

function getToken() {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const exp = parseInt(sessionStorage.getItem(TOKEN_EXP_KEY) || '0', 10)
  if (!token || Date.now() > exp) {
    clearToken()
    return null
  }
  return token
}

function storeToken(token, expiresIn) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000 - 10000))

  const payload = decodeJwtPayload(token)
  user.value = payload
    ? { name: payload.name || payload.preferred_username || payload.sub, sub: payload.sub }
    : null
  isAuthenticated.value = true
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXP_KEY)
  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('pkce_state')
  isAuthenticated.value = false
  user.value = null
}

// ─── Auth flow ───────────────────────────────────────────────────────────────

async function login() {
  if (!AUTH_CONFIG.clientId) {
    console.error('VITE_ZITADEL_CLIENT_ID is not set')
    return
  }

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)))

  sessionStorage.setItem('pkce_verifier', verifier)
  sessionStorage.setItem('pkce_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH_CONFIG.clientId,
    redirect_uri: AUTH_CONFIG.redirectUri,
    scope: AUTH_CONFIG.scopes,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${AUTH_CONFIG.zitadelUrl}/oauth/v2/authorize?${params}`
}

async function handleCallback(code, state) {
  const verifier = sessionStorage.getItem('pkce_verifier')
  const savedState = sessionStorage.getItem('pkce_state')

  if (state !== savedState) {
    console.error('OAuth state mismatch')
    return false
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: AUTH_CONFIG.redirectUri,
    client_id: AUTH_CONFIG.clientId,
    code_verifier: verifier,
  })

  try {
    const res = await fetch(`${AUTH_CONFIG.zitadelUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error_description || data.error)
    storeToken(data.access_token, data.expires_in)
    return true
  } catch (err) {
    console.error('Token exchange failed:', err.message)
    return false
  }
}

function logout() {
  clearToken()
}

// ─── Init (check existing token) ─────────────────────────────────────────────

function initAuth() {
  const token = getToken()
  if (token) {
    const payload = decodeJwtPayload(token)
    user.value = payload
      ? { name: payload.name || payload.preferred_username || payload.sub, sub: payload.sub }
      : null
    isAuthenticated.value = true
  }
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useAuth() {
  return {
    isAuthenticated: readonly(isAuthenticated),
    user: readonly(user),
    getToken,
    login,
    logout,
    handleCallback,
    initAuth,
  }
}
