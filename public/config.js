const CONFIG = {
    isLocal: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
    BASE_URL: '/shokyuucards',
    get API_URL() {
        // En producción (Fullscreencode), el frontend está en Ferozo APACHE y el backend en VPS NODE.JS
        // REQUIERE FETCH ABSOLUTO CROSS-ORIGIN
        const isProdHost = window.location.hostname.includes('fullscreencode.com') || window.location.hostname.includes('dattaweb.com');
        if (isProdHost) return `https://vps-4455523-x.dattaweb.com${this.BASE_URL}/api`;
        
        if (this.isLocal) return `http://localhost:7500${this.BASE_URL}/api`;
        
        return `${this.BASE_URL}/api`;
    },
    get SOCKET_URL() {
        if (window.location.hostname.includes('dattaweb.com')) return `https://vps-4455523-x.dattaweb.com`;
        
        return window.location.origin;
    },
    socketPath: '/shokyuucards/socket.io',
    authUrl: 'https://fullscreencode.com/fscauth/?redirect=' + encodeURIComponent(window.location.href),
    openaiApiKey: ''
};

// Exponer la configuración globalmente
window.config = CONFIG;
window.API_URL = CONFIG.API_URL;
window.SOCKET_URL = CONFIG.SOCKET_URL;
window.BASE_URL = CONFIG.BASE_URL;
window.AUTH_URL = CONFIG.authUrl;