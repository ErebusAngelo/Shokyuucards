// Sistema de Autenticación Frontend - Integración FSC SSO
class AuthSystem {
    constructor() {
        this.user = null;
    }

    async init() {
        console.log('--- Iniciando Sistema de Identidad FSC ---');
        const authenticated = await this.verifySession();

        if (authenticated) {
            this.showAuthenticatedState();
        } else {
            this.showLoginPrompt();
        }

        this.setupEventListeners();
    }

    async verifySession() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
            const response = await fetch(`${window.API_URL}/me`, {
                method: 'GET',
                credentials: 'include',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                return true;
            }
            return false;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error verificando sesión global:', error);
            return false;
        }
    }

    showLoginPrompt() {
        const authStatus = document.getElementById('authStatus');
        const ssoSection = document.getElementById('ssoLoginSection');
        const mainApp = document.getElementById('mainApp');

        if (authStatus) authStatus.classList.add('hidden');
        if (ssoSection) ssoSection.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('auth-blur');
    }

    handleSsoLogin() {
        window.location.href = window.AUTH_URL;
    }

    showAuthenticatedState() {
        const authContainer = document.getElementById('authContainer');
        const mainApp = document.getElementById('mainApp');
        
        if (authContainer) authContainer.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('auth-blur');

        this.updateUserInfo();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('btnFscLogin');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleSsoLogin());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    updateUserInfo() {
        const welcomeUser = document.getElementById('welcomeUser');
        if (welcomeUser && this.user) {
            welcomeUser.textContent = `Bienvenido, ${this.user.username || this.user.email}`;
        }
    }

    logout() {
        window.location.href = 'https://fullscreencode.com/fscauth/logout?redirect=' + encodeURIComponent(window.location.href);
    }
}

// Inicializar el sistema de autenticación cuando se carga la página
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
    authSystem.init();
});