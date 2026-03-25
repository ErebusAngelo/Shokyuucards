/**
 * AuthSystem - Shokyuucards Global Identity Layer
 * Integrates with Fullscreen (FSC) SSO Ecosystem.
 */
class AuthSystem {
    constructor() {
        this.container = document.getElementById('authContainer');
        this.status = document.getElementById('authStatus');
        this.loginSection = document.getElementById('ssoLoginSection');
        this.loginBtn = document.getElementById('btnFscLogin');
        this.mainApp = document.getElementById('mainApp');
        
        this.user = null;
        this.init();
    }

    async init() {
        if (!this.container) return;
        
        // 1. Mostrar contenedor con desenfoque suave
        this.container.style.display = 'flex';
        this.container.style.opacity = '1';
        
        // 2. Bypass para desarrollo local (Si así se desea en config)
        if (window.config.isLocal) {
            console.warn('🛠️ [MODO LOCAL] Saltando verificación de SSO para desarrollo.');
            // Opcional: Descomentar lo siguiente para forzar login en local
            // this.checkSession(); 
            this.unlockApp('GUEST_DEV');
            return;
        }

        this.checkSession();
    }

    async checkSession() {
        try {
            const user = await this.verifySession();
            if (user) {
                this.user = user;
                this.unlockApp(user);
            } else {
                this.showLoginPrompt();
            }
        } catch (error) {
            console.error('Error en Identity Check:', error);
            this.showError('No se pudo conectar con el servidor de identidad.');
        }
    }

    async verifySession() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
            const response = await fetch(`${window.API_URL}/me`, {
                method: 'GET',
                credentials: 'include',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                return data.user;
            }
            return null;
        } catch (error) {
            clearTimeout(timeoutId);
            return null;
        }
    }

    unlockApp(user) {
        // Animación de salida premium
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
            this.mainApp.classList.remove('auth-blur');
            console.log('✅ Identidad Verificada:', user.username || 'Usuario FSC');
        }, 600);
    }

    showLoginPrompt() {
        if (this.status) this.status.classList.add('hidden');
        if (this.loginSection) this.loginSection.classList.remove('hidden');
        
        if (this.loginBtn) {
            this.loginBtn.onclick = () => {
                window.location.href = window.AUTH_URL;
            };
        }
    }

    showError(msg) {
        if (this.status) {
            this.status.innerHTML = `<p style="color:#ff4444; font-weight:bold;">❌ ${msg}</p>`;
        }
        if (this.loginSection) this.loginSection.classList.remove('hidden');
        if (this.loginBtn) {
            this.loginBtn.textContent = 'Reintentar Acceso';
            this.loginBtn.onclick = () => window.location.reload();
        }
    }
}

// Iniciar sistema
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});