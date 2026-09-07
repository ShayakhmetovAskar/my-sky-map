import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_SOLVER_API_URL || '/api/v1'

/**
 * Client for the unauthenticated public API used by the shared viewer at `/s/:token`.
 *
 * Deliberately not `apiClient`:
 *  - no Authorization header — the reader is "anyone with the link", and the endpoint
 *    must never depend on a token being present;
 *  - no 401 response interceptor — `apiClient` logs the user out on 401, so a stale
 *    token sitting in sessionStorage would sign a visitor out of a page they only
 *    opened to look at someone's photos.
 */
const publicClient = axios.create({
  baseURL: API_BASE_URL,
})

export default publicClient
