const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    path: '/shokyuucards/socket.io',
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const cors = require('cors');
const { connectToDatabase, closeConnection } = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Detectar si estamos corriendo en local o producción
const isRunningLocal = process.env.NODE_ENV !== 'production' && 
                      (process.env.LOCAL === 'true' || 
                       process.argv.includes('--local') || 
                       !process.env.VPS_MODE);

const PORT = process.env.PORT || 7500;
const VPS_BASE_URL = 'https://vps-4455523-x.dattaweb.com';

// Clave secreta para JWT (en producción debe estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'shokyuucards_secret_key_change_in_production';

let db = null;

// Función para conectar a la base de datos
async function connectToDatabaseWrapper() {
    if (db) return db;

    try {
        console.log('Intentando conectar a MongoDB...');
        console.log('Modo:', isRunningLocal ? 'local' : 'Atlas');
        db = await connectToDatabase(isRunningLocal);
        console.log('✅ Conexión exitosa a MongoDB');
        return db;
    } catch (error) {
        console.error('❌ Error detallado al conectar a MongoDB:', error);
        throw error;
    }
}

// Configuración de CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware para logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
    next();
});

// Middleware para parsear JSON
app.use(express.json({ limit: '50mb' }));

// Middleware para parsear URL encoded
app.use(express.urlencoded({ extended: true }));

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

// Configurar archivos estáticos
app.use('/shokyuucards', express.static(path.join(__dirname, 'public')));

// Ruta principal de la aplicación
app.get('/shokyuucards', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta raíz redirige a la aplicación
app.get('/', (req, res) => {
    const redirectUrl = isRunningLocal ? 
        `http://localhost:${PORT}/shokyuucards` : 
        `${VPS_BASE_URL}/shokyuucards`;
    res.redirect(redirectUrl);
});

// ==========================================
// RUTAS DE AUTENTICACIÓN Y SISTEMA DE ACCESO
// ==========================================

// Ruta de prueba para verificar el estado del servidor
app.get('/shokyuucards/api/status', (req, res) => {
    res.json({ 
        status: 'active',
        version: '1.0.0',
        environment: isRunningLocal ? 'local' : 'production',
        app: 'Shokyuu Cards',
        timestamp: new Date().toISOString()
    });
});

// Ruta para obtener configuración del cliente
app.get('/shokyuucards/api/config', (req, res) => {
    res.json({
        isLocal: isRunningLocal,
        socketPath: '/shokyuucards/socket.io',
        app: 'Shokyuu Cards'
    });
});

// Registro de usuarios
app.post('/shokyuucards/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');

        // Verificar si el usuario ya existe
        const existingUser = await usersCollection.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Usuario o email ya existe' });
        }

        // Hashear la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear el usuario
        const newUser = {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: null
        };

        const result = await usersCollection.insertOne(newUser);

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            userId: result.insertedId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Login de usuarios
app.post('/shokyuucards/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');

        // Buscar el usuario
        const user = await usersCollection.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar la contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar último login
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );

        // Crear JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                username: user.username,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Verificar token y obtener información del usuario
app.get('/shokyuucards/api/me', authenticateToken, async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne(
            { _id: new require('mongodb').ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de Administración
app.get('/shokyuucards/api/admin/users', async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        
        // Obtener todos los usuarios (sin contraseñas)
        const users = await db.collection('users')
            .find({}, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .toArray();
        
        // Calcular estadísticas
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        const stats = {
            total: users.length,
            online: users.filter(user => 
                user.lastLogin && new Date(user.lastLogin) > fiveMinutesAgo
            ).length,
            newToday: users.filter(user => 
                user.createdAt && new Date(user.createdAt) >= todayStart
            ).length
        };
        
        res.json({ users, stats });
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

async function startServer() {
    try {
        // Conectar a la base de datos
        await connectToDatabaseWrapper();
        
        // Iniciar el servidor
        http.listen(PORT, () => {
            console.log('\n🚀 ===== SERVIDOR SHOKYUU CARDS INICIADO =====');
            console.log(`📍 Entorno: ${isRunningLocal ? 'LOCAL' : 'PRODUCCIÓN'}`);
            console.log(`🌐 Puerto: ${PORT}`);
            
            if (isRunningLocal) {
                console.log(`🔗 URL Local: http://localhost:${PORT}/shokyuucards`);
            } else {
                console.log(`🔗 URL Producción: ${VPS_BASE_URL}/shokyuucards`);
            }
            
            console.log('===============================================\n');
        });

        // Manejar cierre graceful
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
