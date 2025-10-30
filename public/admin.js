// Panel de Administración
class AdminPanel {
    constructor() {
        this.users = [];
        this.stats = {
            total: 0,
            online: 0,
            newToday: 0
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUsers();
        
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.loadUsers();
        }, 30000);
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadUsers();
        });
    }

    async loadUsers() {
        try {
            this.showLoading();
            
            const response = await fetch(`${API_URL}/admin/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.users = data.users || [];
                this.stats = data.stats || this.stats;
                this.renderUsers();
                this.updateStats();
                this.hideError();
            } else {
                const errorData = await response.json();
                this.showError(errorData.message || 'Error al cargar usuarios');
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            this.showError('Error de conexión. Verifica que el servidor esté funcionando.');
        }
    }

    renderUsers() {
        const tableContainer = document.getElementById('usersTableContainer');
        const tableBody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');
        const loadingMessage = document.getElementById('loadingMessage');

        loadingMessage.style.display = 'none';

        if (this.users.length === 0) {
            tableContainer.style.display = 'none';
            noUsersMessage.style.display = 'block';
            return;
        }

        noUsersMessage.style.display = 'none';
        tableContainer.style.display = 'block';

        tableBody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            
            const registrationDate = new Date(user.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const lastAccess = user.lastLogin 
                ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'Nunca';

            const isOnline = this.isUserOnline(user.lastLogin);
            const statusClass = isOnline ? 'status-online' : 'status-offline';
            const statusText = isOnline ? 'En línea' : 'Desconectado';

            row.innerHTML = `
                <td><strong>${this.escapeHtml(user.username)}</strong></td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${registrationDate}</td>
                <td>${lastAccess}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;

            tableBody.appendChild(row);
        });
    }

    updateStats() {
        document.getElementById('totalUsers').textContent = this.stats.total;
        document.getElementById('onlineUsers').textContent = this.stats.online;
        document.getElementById('newUsersToday').textContent = this.stats.newToday;
    }

    isUserOnline(lastLogin) {
        if (!lastLogin) return false;
        
        const lastLoginTime = new Date(lastLogin).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
        
        return (now - lastLoginTime) < fiveMinutes;
    }

    showLoading() {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('usersTableContainer').style.display = 'none';
        document.getElementById('noUsersMessage').style.display = 'none';
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        document.getElementById('loadingMessage').style.display = 'none';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar el panel de administración
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});