const { MongoClient } = require('mongodb');

// Configuración de MongoDB
const MONGODB_CONFIG = {
    local: {
        uri: 'mongodb://localhost:27017',
        dbName: 'shokyuucards_local'
    },
    production: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        dbName: process.env.MONGODB_DB_NAME || 'shokyuucards_prod'
    }
};

let client = null;
let db = null;

async function connectToDatabase(isLocal = true) {
    try {
        if (db) {
            console.log('Reutilizando conexión existente a MongoDB');
            return db;
        }

        const config = isLocal ? MONGODB_CONFIG.local : MONGODB_CONFIG.production;
        
        console.log(`Conectando a MongoDB (${isLocal ? 'local' : 'producción'})...`);
        console.log(`URI: ${config.uri}`);
        console.log(`Base de datos: ${config.dbName}`);

        client = new MongoClient(config.uri, {
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });

        await client.connect();
        db = client.db(config.dbName);

        // Verificar la conexión
        await db.admin().ping();
        console.log('✅ Conexión exitosa a MongoDB');

        // Crear índices necesarios para la aplicación
        await createIndexes(db);

        return db;
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        throw error;
    }
}

async function createIndexes(database) {
    try {
        // Índices para la colección de usuarios
        await database.collection('users').createIndex({ username: 1 }, { unique: true });
        await database.collection('users').createIndex({ email: 1 }, { unique: true });
        
        // Índices para la colección de cartas/flashcards
        await database.collection('flashcards').createIndex({ userId: 1 });
        await database.collection('flashcards').createIndex({ createdAt: -1 });
        
        // Índices para la colección de sets de cartas
        await database.collection('cardsets').createIndex({ userId: 1 });
        await database.collection('cardsets').createIndex({ name: 1, userId: 1 }, { unique: true });
        
        console.log('✅ Índices de base de datos creados correctamente');
    } catch (error) {
        console.log('⚠️ Algunos índices ya existían o hubo un error menor:', error.message);
    }
}

async function closeConnection() {
    try {
        if (client) {
            await client.close();
            client = null;
            db = null;
            console.log('✅ Conexión a MongoDB cerrada correctamente');
        }
    } catch (error) {
        console.error('❌ Error al cerrar la conexión a MongoDB:', error.message);
    }
}

// Función para obtener la instancia de la base de datos
function getDatabase() {
    if (!db) {
        throw new Error('Base de datos no inicializada. Llama a connectToDatabase() primero.');
    }
    return db;
}

module.exports = {
    connectToDatabase,
    closeConnection,
    getDatabase
};