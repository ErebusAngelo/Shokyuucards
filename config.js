// config.js - Configuración de URLs para desarrollo local y producción

// Detectar si estamos en desarrollo local
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === '';

// URLs base según el entorno
const LOCAL_BASE_URL = 'http://localhost:7500';
const PRODUCTION_BASE_URL = 'https://vps-4455523-x.dattaweb.com';

// Configuración de URLs
const CONFIG = {
    // URL base de la API
    API_BASE_URL: isLocal ? LOCAL_BASE_URL : PRODUCTION_BASE_URL,
    
    // Rutas específicas de la API para Shokyuu Cards
    API_ROUTES: {
        BASE: isLocal ? '/shokyuucards/api' : '/shokyuucards/api',
        // Rutas de autenticación
        LOGIN: '/login',
        REGISTER: '/register',
        ME: '/me',
        // Rutas de configuración
        CONFIG: '/config',
        STATUS: '/status',
        // Rutas de flashcards (para implementar después)
        CARDS: '/cards',
        CARDSETS: '/cardsets',
        STUDY: '/study',
        PROGRESS: '/progress'
    },
    
    // Configuración de Socket.IO
    SOCKET_CONFIG: {
        PATH: '/shokyuucards/socket.io',
        URL: isLocal ? LOCAL_BASE_URL : PRODUCTION_BASE_URL
    },
    
    // Configuración del entorno
    ENVIRONMENT: {
        IS_LOCAL: isLocal,
        IS_PRODUCTION: !isLocal
    },
    
    // Configuración específica de Shokyuu Cards
    APP_CONFIG: {
        NAME: 'Shokyuu Cards',
        VERSION: '1.0.0',
        DESCRIPTION: 'Sistema de flashcards para aprendizaje de japonés'
    },
    
    // Configuración de la aplicación
    FEATURES: {
        ENABLE_REGISTRATION: true,
        ENABLE_GUEST_MODE: false,
        MAX_CARDS_PER_SET: 1000,
        MAX_CARDSETS_PER_USER: 50
    }
};

// Función helper para construir URLs completas de la API
function getApiUrl(route) {
    return CONFIG.API_BASE_URL + CONFIG.API_ROUTES.BASE + CONFIG.API_ROUTES[route];
}

// Función helper para obtener la URL base de la aplicación
function getAppUrl() {
    return CONFIG.API_BASE_URL + '/shokyuucards';
}

// Exportar configuración para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getApiUrl, getAppUrl };
}