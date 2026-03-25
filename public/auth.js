// Sistema de Autenticación Frontend - Integración FSC SSO
class AuthSystem {
    constructor() {
        this.user = null;
        this.init();
    }

    async init() {
        console.log('--- Iniciando Sistema de Identidad FSC ---');
        
        // El token ahora se gestiona vía Cookies de dominio .fullscreencode.com
        // Intentamos validar la sesión con el backend
        const authenticated = await this.verifySession();

        if (authenticated) {
            this.showMainApp();
            this.setupEventListeners();
        } else {
            this.redirectToLogin();
        }
    }

    async verifySession() {
        try {
            const response = await fetch(`${window.API_URL}/me`, {
                method: 'GET',
                credentials: 'include' // Obligatorio para enviar la cookie 'token'
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.updateUserInfo();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error verificando sesión global:', error);
            return false;
        }
    }

    redirectToLogin() {
        // Redirigir al portal de autenticación central
        window.location.href = window.AUTH_URL;
    }

    setupEventListeners() {
        // Solo necesitamos el botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    showMainApp() {
        const authContainer = document.getElementById('authContainer');
        const mainApp = document.getElementById('mainApp');
        
        if (authContainer) authContainer.style.display = 'none';
        if (mainApp) mainApp.classList.remove('hidden');
    }

    updateUserInfo() {
        const welcomeUser = document.getElementById('welcomeUser');
        if (welcomeUser && this.user) {
            welcomeUser.textContent = `Bienvenido, ${this.user.username || this.user.email}`;
        }
    }

    logout() {
        // En un sistema SSO, el logout debe ser global
        window.location.href = 'https://fullscreencode.com/fscauth/logout?redirect=' + encodeURIComponent(window.location.href);
    }

    isAuthenticated() {
        return !!this.user;
    }
}

// Inicializar el sistema de autenticación cuando se carga la página
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
});