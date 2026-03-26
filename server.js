require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectToDatabase, closeConnection } = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BASE_PATH = process.env.BASE_PATH || '/shokyuucards';
const PORT = process.env.PORT || 7500;
const JWT_SECRET = process.env.JWT_SECRET || 'arte_digital_data_jwt_secret_2024_secure'; // Sincronizado con Ecosistema FSC
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
        "http://localhost:7500",
        "http://localhost:5501",
        "http://127.0.0.1:5501"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true // INDISPENSABLE para leer las cookies de fscauth
}));

let db = null;

// Fallback in-memory para desarrollo local si falla MongoDB
const mockUsers = [];
const mockDB = {
    collection: function(name) {
        if (name === 'users') {
            return {
                findOne: async (query) => {
                    const keys = Object.keys(query);
                    if (keys.includes('$or')) {
                        return mockUsers.find(u => 
                            u.username === query.$or[0].username || 
                            u.email === query.$or[1].email
                        ) || null;
                    }
                    if (query.username) return mockUsers.find(u => u.username === query.username) || null;
                    if (query.email) return mockUsers.find(u => u.email === query.email) || null;
                    return null;
                },
                insertOne: async (doc) => {
                    mockUsers.push({...doc, _id: 'mock-id-' + Date.now()});
                    return { insertedId: 'mock-id-' + Date.now() };
                }
            };
        }
        // Mock fallback generico para otras colecciones
        return {
            findOne: async () => null,
            find: () => ({ toArray: async () => [] }),
            insertOne: async () => ({ insertedId: 'mock-id-12345' })
        };
    }
};

// Función para conectar a la base de datos
async function connectToDatabaseWrapper() {
    if (db) return db;

    try {
        console.log('Intentando conectar a MongoDB...');
        db = await connectToDatabase();
        console.log('✅ Conexión exitosa a MongoDB');
        return db;
    } catch (error) {
        console.warn('⚠️ [DB ADVERTENCIA] No se pudo conectar a MongoDB. Usando DB en memoria para desarrollo local.');
        return mockDB;
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
    const token = req.cookies.fsc_token || req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

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

const apiRouter = express.Router();

// Estado del servidor (Público)
apiRouter.get(`/api/health`, (req, res) => {
    res.json({ status: 'ok', environment: NODE_ENV });
});

// Estado detallado
apiRouter.get(`/api/status`, authenticateToken, (req, res) => {
    res.json({ 
        status: 'active',
        version: '1.2.0',
        environment: NODE_ENV,
        app: 'Shokyuu Cards FSC',
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

// Configuración del cliente
apiRouter.get(`/api/config`, (req, res) => {
    res.json({
        isLocal: NODE_ENV === 'local',
        basePath: BASE_PATH,
        socketPath: `${BASE_PATH}/socket.io`,
        authUrl: 'https://fullscreencode.com/fscauth/login?redirect=' + encodeURIComponent('https://fullscreencode.com' + BASE_PATH)
    });
});

// Login Integrado
apiRouter.post(`/api/login`, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });

    try {
        const db = await connectToDatabaseWrapper();
        const user = await db.collection('users').findOne({ 
            $or: [{ username: username }, { email: username }] 
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { email: user.email, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );

        // Galleta global opcional dependiendo de entorno local
        const cookieOptions = { 
            httpOnly: true, 
            secure: NODE_ENV !== 'local', 
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 
        };
        if (NODE_ENV !== 'local') {
            cookieOptions.domain = '.fullscreencode.com';
        }

        res.cookie('fsc_token', token, cookieOptions);

        res.json({ success: true, user: { username: user.username, email: user.email } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Registro Integrado
apiRouter.post(`/api/register`, async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Todos los campos son obligatorios.' });

    try {
        const db = await connectToDatabaseWrapper();
        
        // Verificar si ya existe
        const existing = await db.collection('users').findOne({ $or: [{ username }, { email }] });
        if (existing) return res.status(400).json({ error: 'El usuario o email ya están registrados.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username,
            email,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date()
        };

        await db.collection('users').insertOne(newUser);

        const token = jwt.sign(
            { email: newUser.email, username: newUser.username }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );

        const cookieOptions = { 
            httpOnly: true, 
            secure: NODE_ENV !== 'local', 
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 
        };
        if (NODE_ENV !== 'local') {
            cookieOptions.domain = '.fullscreencode.com';
        }

        res.cookie('fsc_token', token, cookieOptions);

        res.json({ success: true, user: { username: newUser.username, email: newUser.email } });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Error al crear el usuario.' });
    }
});

// Obtener mi perfil (Validación de sesión global)
apiRouter.get(`/api/me`, authenticateToken, async (req, res) => {
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
apiRouter.get(`/api/admin/users`, authenticateToken, async (req, res) => {
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

// Registrar routers para evadir NGINX strip behavior
app.use(BASE_PATH, apiRouter);
app.use('/', apiRouter);

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
        // Intentar conectar a la base de datos pero no morir si falla (útil en desarrollo)
        try {
            await connectToDatabaseWrapper();
        } catch (dbError) {
            console.error('⚠️ [DB ADVERTENCIA] No se pudo conectar a MongoDB. El servidor funcionará en modo limitado (sin persistencia).');
        }
        
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
            try { await closeConnection(); } catch (e) {}
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();
