const CONFIG = {
    isLocal: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
    BASE_URL: '/shokyuucards',
    get API_URL() {
        // En producción (Fullscreencode o Dattaweb), apuntamos al NGINX del VPS (puerto 443 oculto)
        const isProdHost = window.location.hostname === 'fullscreencode.com' || window.location.hostname.includes('dattaweb.com');
        if (isProdHost) return `https://vps-4455523-x.dattaweb.com${this.BASE_URL}/api`;
        
        // En modo local (XAMPP o Live Server), SIEMPRE apuntamos al puerto 7500 backend
        if (this.isLocal) return `http://localhost:7500${this.BASE_URL}/api`;
        
        // Por defecto ruta relativa
        return `${this.BASE_URL}/api`;
    },
    get SOCKET_URL() {
        const isProdHost = window.location.hostname === 'fullscreencode.com' || window.location.hostname.includes('dattaweb.com');
        if (isProdHost) return `https://vps-4455523-x.dattaweb.com`;
        
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