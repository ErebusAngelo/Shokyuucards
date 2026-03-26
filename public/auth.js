/**
 * AuthSystem - Shokyuucards Integrated Identity Layer
 */
class AuthSystem {
    constructor() {
        this.container = document.getElementById('authContainer');
        this.status = document.getElementById('authStatus');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.mainApp = document.getElementById('mainApp');
        this.errorMsg = document.getElementById('authError');
        
        this.user = null;
        this.init();
    }

    async init() {
        if (!this.container) return;
        
        this.container.style.display = 'flex';
        this.container.style.opacity = '1';

        // Listeners para cambiar entre login y registro
        document.getElementById('toRegister').onclick = (e) => {
            e.preventDefault();
            this.showRegister();
        };
        document.getElementById('toLogin').onclick = (e) => {
            e.preventDefault();
            this.showLogin();
        };

        // Listeners de submit
        this.loginForm.onsubmit = (e) => this.handleLogin(e);
        this.registerForm.onsubmit = (e) => this.handleRegister(e);

        this.checkSession();
    }

    async checkSession() {
        try {
            const user = await this.verifySession();
            if (user) {
                this.user = user;
                this.unlockApp(user);
            } else {
                this.showLogin();
            }
        } catch (error) {
            this.showLogin();
        }
    }

    async verifySession() {
        try {
            const response = await fetch(`${window.API_URL}/me`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                return data.user;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    showLogin() {
        this.status.classList.add('hidden');
        this.registerForm.classList.add('hidden');
        this.loginForm.classList.remove('hidden');
        this.errorMsg.classList.add('hidden');
    }

    showRegister() {
        this.status.classList.add('hidden');
        this.loginForm.classList.add('hidden');
        this.registerForm.classList.remove('hidden');
        this.errorMsg.classList.add('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUser').value;
        const password = document.getElementById('loginPass').value;

        this.setLoading(true);
        try {
            const response = await fetch(`${window.API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.unlockApp(data.user);
            } else {
                this.showError(data.error || 'Fallo el inicio de sesión.');
            }
        } catch (error) {
            this.showError('Error de conexión con el servidor.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('regUser').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPass').value;

        this.setLoading(true);
        try {
            const response = await fetch(`${window.API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.unlockApp(data.user);
            } else {
                this.showError(data.error || 'Fallo el registro.');
            }
        } catch (error) {
            this.showError('Error de conexión con el servidor.');
        } finally {
            this.setLoading(false);
        }
    }

    unlockApp(user) {
        this.container.style.opacity = '0';
        setTimeout(() => {
            this.container.style.display = 'none';
            this.mainApp.classList.remove('auth-blur');
            // Actualizar UI de bienvenida
            const welcome = document.getElementById('welcomeUser');
            if (welcome) welcome.textContent = `Bienvenido, ${user.username}`;
        }, 600);
    }

    setLoading(isLoading) {
        const btn = this.loginForm.querySelector('button');
        const btnReg = this.registerForm.querySelector('button');
        if (isLoading) {
            if (btn) btn.disabled = true;
            if (btnReg) btnReg.disabled = true;
        } else {
            if (btn) btn.disabled = false;
            if (btnReg) btnReg.disabled = false;
        }
    }

    showError(msg) {
        this.errorMsg.textContent = msg;
        this.errorMsg.classList.remove('hidden');
    }
}

// Iniciar sistema
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});