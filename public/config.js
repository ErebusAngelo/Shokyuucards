const CONFIG = {
    isLocal: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
    BASE_URL: '/shokyuucards',
    get API_URL() {
        // Si está navegando directamente por la IP o Dominio del VPS (No recomendado, pero soportado)
        if (window.location.hostname.includes('dattaweb.com')) return `https://vps-4455523-x.dattaweb.com${this.BASE_URL}/api`;
        
        // En modo local (XAMPP o Live Server), SIEMPRE apuntamos al puerto 7500 backend
        if (this.isLocal) return `http://localhost:7500${this.BASE_URL}/api`;
        
        // Por defecto (fullscreencode.com) usar ruta relativa para que funcione la Cookie First-Party
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