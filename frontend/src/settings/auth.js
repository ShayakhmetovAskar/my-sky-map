export const AUTH_CONFIG = {
  zitadelUrl: import.meta.env.VITE_ZITADEL_URL || 'http://host.docker.internal:8080',
  clientId: import.meta.env.VITE_ZITADEL_CLIENT_ID || '',
  redirectUri: window.location.origin + '/',
  scopes: 'openid profile email',
}
