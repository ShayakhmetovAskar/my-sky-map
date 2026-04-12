import { ref, readonly } from 'vue'
import { AUTH_CONFIG } from '@/settings/auth'

const TOKEN_KEY = 'skymap_access_token'
const TOKEN_EXP_KEY = 'skymap_token_exp'
const REFRESH_TOKEN_KEY = 'skymap_refresh_token'
const IS_GUEST_KEY = 'skymap_is_guest'
const GUEST_USER_ID_KEY = 'skymap_guest_user_id'
const GUEST_PUBLIC_NAME_KEY = 'skymap_guest_public_name'

const isAuthenticated = ref(false)
const user = ref(null)

// ─── Storage strategy ────────────────────────────────────────────────────────
// Guest sessions → localStorage (persist across tabs/reloads)
// Regular login  → sessionStorage (cleared when browser closes)
// We detect which storage to use via IS_GUEST_KEY stored in localStorage.

function guestStorage() { return localStorage }
function regularStorage() { return sessionStorage }

function isGuestSession() {
  return localStorage.getItem(IS_GUEST_KEY) === 'true'
}

function activeStorage() {
  return isGuestSession() ? guestStorage() : regularStorage()
}

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
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

// ─── Token management ────────────────────────────────────────────────────────

function getToken() {
  const storage = activeStorage()
  const token = storage.getItem(TOKEN_KEY)
  const exp = parseInt(storage.getItem(TOKEN_EXP_KEY) || '0', 10)
  if (!token || Date.now() > exp) {
    return null
  }
  return token
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function storeRegularToken(token, expiresIn) {
  localStorage.removeItem(IS_GUEST_KEY)
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000 - 10000))

  const payload = decodeJwtPayload(token)
  user.value = payload
    ? { name: payload.name || payload.preferred_username || payload.sub, sub: payload.sub }
    : null
  isAuthenticated.value = true
}

function _writeGuestTokens(token, expiresIn, refreshToken) {
  localStorage.setItem(IS_GUEST_KEY, 'true')
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000 - 10000))
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

function _activateGuestUser(guestUserId, publicName) {
  user.value = {
    name: publicName || 'Guest',
    sub: guestUserId,
    isGuest: true,
    publicName,
  }
  isAuthenticated.value = true
}

/**
 * Initial guest session — called after POST /auth/guest. Persists the
 * guest_user_id and public_name so future refreshes can reuse them.
 */
function createGuestSession({ token, expiresIn, refreshToken, guestUserId, publicName }) {
  _writeGuestTokens(token, expiresIn, refreshToken)
  if (guestUserId) localStorage.setItem(GUEST_USER_ID_KEY, guestUserId)
  if (publicName) localStorage.setItem(GUEST_PUBLIC_NAME_KEY, publicName)
  _activateGuestUser(guestUserId, publicName)
}

/**
 * Refresh — called after grant_type=refresh_token. The guest_user_id and
 * public_name are NOT returned by the refresh response, so we read them
 * from storage and keep the existing identity.
 */
function updateGuestTokens({ token, expiresIn, refreshToken }) {
  _writeGuestTokens(token, expiresIn, refreshToken)
  _activateGuestUser(
    localStorage.getItem(GUEST_USER_ID_KEY),
    localStorage.getItem(GUEST_PUBLIC_NAME_KEY),
  )
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXP_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXP_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(IS_GUEST_KEY)
  localStorage.removeItem(GUEST_USER_ID_KEY)
  localStorage.removeItem(GUEST_PUBLIC_NAME_KEY)
  isAuthenticated.value = false
  user.value = null
}

function clearPkce() {
  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('pkce_state')
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
    storeRegularToken(data.access_token, data.expires_in)
    sessionStorage.removeItem('pkce_verifier')
    sessionStorage.removeItem('pkce_state')
    return true
  } catch (err) {
    console.error('Token exchange failed:', err.message)
    return false
  }
}

async function loginAsGuest() {
  const API_BASE_URL = import.meta.env.VITE_SOLVER_API_URL || '/api/v1'
  try {
    const res = await fetch(`${API_BASE_URL}/auth/guest`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Guest login failed')
    createGuestSession({
      token: data.token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
      guestUserId: data.user_id,
      publicName: data.public_name,
    })
    return true
  } catch (err) {
    console.error('Guest login failed:', err.message)
    return false
  }
}

// ─── Guest refresh ───────────────────────────────────────────────────────────

let refreshPromise = null

async function refreshGuestToken() {
  // Dedupe concurrent refresh calls
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken || !isGuestSession()) return false

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: AUTH_CONFIG.clientId,
      scope: 'openid profile offline_access',
    })

    try {
      const res = await fetch(`${AUTH_CONFIG.zitadelUrl}/oauth/v2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error_description || data.error || 'refresh failed')

      updateGuestTokens({
        token: data.access_token,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token || refreshToken,
      })
      return true
    } catch (err) {
      console.warn('Guest refresh failed:', err.message)
      clearToken()
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function isGuest() {
  return !!user.value?.isGuest
}

function logout() {
  clearToken()
  clearPkce()
}

// ─── Init (check existing token) ─────────────────────────────────────────────

async function initAuth() {
  const guest = isGuestSession()
  const storage = guest ? localStorage : sessionStorage
  const token = storage.getItem(TOKEN_KEY)
  const exp = parseInt(storage.getItem(TOKEN_EXP_KEY) || '0', 10)

  if (!token) return

  // Token still valid
  if (Date.now() < exp) {
    const payload = decodeJwtPayload(token)
    if (guest) {
      const publicName = localStorage.getItem(GUEST_PUBLIC_NAME_KEY)
      user.value = {
        name: publicName || 'Guest',
        sub: localStorage.getItem(GUEST_USER_ID_KEY),
        isGuest: true,
        publicName,
      }
    } else {
      user.value = payload
        ? { name: payload.name || payload.preferred_username || payload.sub, sub: payload.sub }
        : null
    }
    isAuthenticated.value = true
    return
  }

  // Token expired — for guests, try refresh
  if (guest && getRefreshToken()) {
    await refreshGuestToken()
  } else {
    clearToken()
  }
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useAuth() {
  return {
    isAuthenticated: readonly(isAuthenticated),
    user: readonly(user),
    getToken,
    refreshGuestToken,
    login,
    loginAsGuest,
    isGuest,
    logout,
    handleCallback,
    initAuth,
  }
}
