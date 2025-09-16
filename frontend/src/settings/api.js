// API endpoints configuration
export const API_CONFIG = {
    // Base URLs
    PROD_URL: 'https://storage.yandexcloud.net/skymap-static-data',
    
    // DSS (Digital Sky Survey) endpoints
    DSS_SURVEYS: {
        get baseUrl() {
            return `${API_CONFIG.PROD_URL}/dss/v1`;
        }
    },
    
    // Stars data endpoints
    STARS: {
        get baseUrl() {
            return `${API_CONFIG.PROD_URL}/v1`;
        }
    },
    
    // Star Names API
    STAR_NAMES: {
        baseUrl: 'https://skymapdev.afsh.space/api/star'
    },
    
    // Common configuration
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
    },
};

// Helper function to build URLs
export function buildUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    return url.toString();
}

export default API_CONFIG;
