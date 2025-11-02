// Sistema de Autenticación Frontend
class AuthSystem {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = null;
        this.init();
    }

    init() {
        // Verificar si ya hay una sesión activa
        if (this.token) {
            this.verifyToken();
        } else {
            this.showAuthContainer();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Cambiar entre formularios
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Formularios
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    showAuthContainer() {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('mainApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('mainApp').classList.remove('hidden');
    }

    showLoginForm() {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
        this.clearMessage();
    }

    showRegisterForm() {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
        this.clearMessage();
    }

    showMessage(message, type = 'error') {
        const messageEl = document.getElementById('authMessage');
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
    }

    clearMessage() {
        const messageEl = document.getElementById('authMessage');
        messageEl.className = 'auth-message';
        messageEl.textContent = '';
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            this.showMessage('Por favor, completa todos los campos');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('authToken', this.token);
                this.showMessage('¡Inicio de sesión exitoso!', 'success');
                
                setTimeout(() => {
                    this.updateUserInfo();
                    this.showMainApp();
                }, 1000);
            } else {
                this.showMessage(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error de login:', error);
            this.showMessage('Error de conexión. Intenta nuevamente.');
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        if (!username || !email || !password || !passwordConfirm) {
            this.showMessage('Por favor, completa todos los campos');
            return;
        }

        if (password !== passwordConfirm) {
            this.showMessage('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.', 'success');
                setTimeout(() => {
                    this.showLoginForm();
                    document.getElementById('registerFormElement').reset();
                }, 2000);
            } else {
                this.showMessage(data.message || 'Error al crear la cuenta');
            }
        } catch (error) {
            console.error('Error de registro:', error);
            this.showMessage('Error de conexión. Intenta nuevamente.');
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${API_URL}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.updateUserInfo();
                this.showMainApp();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            this.logout();
        }
    }

    updateUserInfo() {
        if (this.user) {
            document.getElementById('welcomeUser').textContent = `Bienvenido, ${this.user.username}`;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        this.showAuthContainer();
        this.clearMessage();
        
        // Limpiar formularios
        document.getElementById('loginFormElement').reset();
        document.getElementById('registerFormElement').reset();
        this.showLoginForm();
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    isAuthenticated() {
        return !!this.token;
    }
}

// Inicializar el sistema de autenticación cuando se carga la página
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
});