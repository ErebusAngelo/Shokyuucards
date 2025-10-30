// Determinar entorno inicial: preferir override guardado, si no usar hostname
const savedEnv = localStorage.getItem('env');
const defaultIsLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
// Si estamos en localhost, forzar entorno local sin importar el override guardado
const initialIsLocal = defaultIsLocal ? true : (savedEnv ? (savedEnv === 'local') : false);

const CONFIG = {
    isLocal: initialIsLocal,
    get API_URL() {
        return this.isLocal ? 'http://localhost:7500/shokyuucards/api' : 'https://vps-4455523-x.dattaweb.com/shokyuucards/api';
    },
    get SOCKET_URL() {
        return this.isLocal ? 'http://localhost:7500' : 'https://vps-4455523-x.dattaweb.com';
    },
    get BASE_URL() {
        return '/shokyuucards';
    },
    setEnvironment(env) {
        this.isLocal = (env === 'local');
        localStorage.setItem('env', this.isLocal ? 'local' : 'vps');
    },
    getEnvironment() {
        return this.isLocal ? 'local' : 'vps';
    },
    // API Key para OpenAI - NO incluir la clave real aquí
    // Reemplazar con tu propia clave antes de usar
    openaiApiKey: ''
};

// Exponer la configuración globalmente
window.config = CONFIG;
window.API_URL = CONFIG.API_URL;
window.SOCKET_URL = CONFIG.SOCKET_URL;
window.BASE_URL = CONFIG.BASE_URL;
window.setEnvironment = (env) => CONFIG.setEnvironment(env);
window.getEnvironment = () => CONFIG.getEnvironment();