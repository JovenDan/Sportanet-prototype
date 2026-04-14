// backend/app.js
// Archivo principal del servidor Express
// - Configura middlewares (CORS, JSON)
// - Registra rutas de la API (/api/users, /api/auth, /api/members)
// - Inicia el servidor en el puerto configurado
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db/connection');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas principales de la API
// /api/users -> CRUD de usuarios
// /api/auth  -> Registro y login (emisión de JWT)
// /api/members -> CRUD de miembros de club con integración Telegram
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));

app.get('/', (req, res) => {
    res.json({
        message: 'Servidor REST funcionando correctamente',
        version: '1.0.0',
        endpoints: {
            'GET /': 'Verificación de conexión',
            'GET /api/members': 'Listar todos los miembros del club',
            'GET /api/members/:id': 'Obtener miembro por ID',
            'POST /api/members': 'Crear nuevo miembro del club',
            'PUT /api/members/:id': 'Actualizar miembro del club',
            'DELETE /api/members/:id': 'Eliminar miembro del club'
        }
    });
});

app.get('/users', (req, res) => {
  pool.query('SELECT * FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API base URL: http://localhost:${port}`);
});
