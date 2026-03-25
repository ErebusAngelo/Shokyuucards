const CONFIG = {
    isLocal: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
    BASE_URL: '/shokyuucards',
    get API_URL() {
        return `${window.location.origin}${this.BASE_URL}/api`;
    },
    get SOCKET_URL() {
        return window.location.origin;
    },
    socketPath: '/shokyuucards/socket.io',
    authUrl: 'https://fullscreencode.com/fscauth/login?redirect=' + encodeURIComponent(window.location.href),
    openaiApiKey: ''
};

// Exponer la configuración globalmente
window.config = CONFIG;
window.API_URL = CONFIG.API_URL;
window.SOCKET_URL = CONFIG.SOCKET_URL;
window.BASE_URL = CONFIG.BASE_URL;
window.AUTH_URL = CONFIG.authUrl;