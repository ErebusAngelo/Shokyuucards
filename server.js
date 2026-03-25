require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectToDatabase, closeConnection } = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuración de Identidad FSC
const PORT = process.env.PORT || 7500;
const BASE_PATH = process.env.BASE_PATH || '/shokyuucards';
const JWT_SECRET = process.env.JWT_SECRET; // Debe venir de .env global
const NODE_ENV = process.env.NODE_ENV || 'local';

// Configuración de Socket.io adaptada a FSC
const io = require('socket.io')(http, {
    path: `${BASE_PATH}/socket.io`,
    cors: {
        origin: ["https://fullscreencode.com", "http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware base
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS Profesional según Manual FSC
app.use(cors({
    origin: [
        "https://fullscreencode.com", 
        "https://vps-4455523-x.dattaweb.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:7500"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true // INDISPENSABLE para leer las cookies de fscauth
}));

let db = null;

// Función para conectar a la base de datos
async function connectToDatabaseWrapper() {
    if (db) return db;

    try {
        console.log('Intentando conectar a MongoDB...');
        db = await connectToDatabase();
        console.log('✅ Conexión exitosa a MongoDB');
        return db;
    } catch (error) {
        console.error('❌ Error detallado al conectar a MongoDB:', error);
        throw error;
    }
}

// Middleware para logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Middleware para verificar JWT (Estándar FSC SSO)
function authenticateToken(req, res, next) {
    // 1. Intentar obtener token de la cookie (Estándar .fullscreencode.com)
    // 2. Intentar obtener token del header Authorization (Bearer)
    const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación global FSC.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Sesión inválida o expirada.' });
        }
        req.user = user;
        next();
    });
}

// Configurar archivos estáticos con BASE_PATH
app.use(BASE_PATH, express.static(path.join(__dirname, 'public')));

// Ruta principal de la aplicación
app.get(BASE_PATH, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Redirección raíz a base path
app.get('/', (req, res) => {
    res.redirect(BASE_PATH);
});

// ==========================================
// RUTAS DE IDENTIDAD Y API
// ==========================================

// Estado del servidor
app.get(`${BASE_PATH}/api/status`, (req, res) => {
    res.json({ 
        status: 'active',
        version: '1.1.0',
        environment: NODE_ENV,
        app: 'Shokyuu Cards FSC',
        timestamp: new Date().toISOString()
    });
});

// Configuración del cliente
app.get(`${BASE_PATH}/api/config`, (req, res) => {
    res.json({
        isLocal: NODE_ENV === 'local',
        basePath: BASE_PATH,
        socketPath: `${BASE_PATH}/socket.io`,
        authUrl: 'https://fullscreencode.com/fscauth/login?redirect=' + encodeURIComponent('https://fullscreencode.com' + BASE_PATH)
    });
});

// Redirección de Auth local a FSC SSO
app.all([`${BASE_PATH}/api/login`, `${BASE_PATH}/api/register`], (req, res) => {
    res.status(301).json({ 
        message: 'La autenticación ahora es global.', 
        redirect: 'https://fullscreencode.com/fscauth/login' 
    });
});

// Obtener mi perfil (Validación de sesión global)
app.get(`${BASE_PATH}/api/me`, authenticateToken, async (req, res) => {
    try {
        // En FSC, el token ya trae el email y username.
        // Si necesitamos más info, consultamos fullscreen_global.users
        const dbGlobal = await connectToDatabaseWrapper();
        const user = await dbGlobal.collection('users').findOne(
            { email: req.user.email },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'Usuario FSC no encontrado en la base global' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error al validar identidad FSC:', error);
        res.status(500).json({ error: 'Error interno en ecosistema de identidad' });
    }
});

// Rutas de Administración
app.get(`${BASE_PATH}/api/admin/users`, authenticateToken, async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        const users = await db.collection('users')
            .find({}, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .toArray();
        
        res.json({ users });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// ==========================================
// CONFIGURACIÓN DE SOCKET.IO
// ==========================================

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

// ==========================================
// FUNCIÓN PARA INICIAR EL SERVIDOR
// ==========================================

// Iniciar el servidor
async function startServer() {
    try {
        await connectToDatabaseWrapper();
        
        http.listen(PORT, () => {
            console.log('\n🚀 ===== SERVIDOR SHOKYUU CARDS (FSC) INICIADO =====');
            console.log(`📍 Entorno: ${NODE_ENV}`);
            console.log(`🌐 Puerto: ${PORT}`);
            console.log(`🔗 Ruta Base: ${BASE_PATH}`);
            console.log(`📡 WebSocket: ${BASE_PATH}/socket.io`);
            console.log('===============================================\n');
        });

        process.on('SIGINT', async () => {
            console.log('\n🛑 Cerrando servidor...');
            await closeConnection();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();
