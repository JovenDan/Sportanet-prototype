const express = require('express');
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const { sendTelegramMessage } = require('../utils/telegram');

const router = express.Router();

function formatMemberNotification(member, action) {
  let roleLabel = 'Miembro';
  if (member.role === 'organizer') roleLabel = 'Organizador';
  if (member.role === 'admin') roleLabel = 'Admin';
  return `${action} de club:\n<b>${member.name}</b>\nRol: ${roleLabel}\nEmail: ${member.email}`;
}

// Map user DB row to member object expected by frontend
function mapUserToMember(row) {
  let role = 'member';
  if (row.userType === 'organizer') role = 'organizer';
  if (row.userType === 'admin') role = 'admin';

  return {
    id: row.user_id,
    name: row.full_name,
    email: row.email,
    age: 0, // No guardamos edad en tabla users directamente
    role: role
  };
}

router.get('/', (req, res) => {
  pool.query('SELECT * FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(mapUserToMember));
  });
});

router.get('/:id', (req, res) => {
  pool.query('SELECT * FROM users WHERE user_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(mapUserToMember(rows[0]));
  });
});

router.post('/', async (req, res) => {
  const { name, email, age, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: "Campo 'name' requerido" });
  }
  if (!email) {
    return res.status(400).json({ error: "Campo 'email' requerido" });
  }

  try {
    // Hasheamos la contraseña por defecto que pidió el usuario: "deault"
    const hashedPwd = await bcrypt.hash('deault', 10);
    
    let userType = 'athlete';
    if (role === 'organizer') userType = 'organizer';
    if (role === 'admin') userType = 'admin';
    
    const userData = {
      userType,
      full_name: name.trim(),
      email,
      phone: null,
      pwd: hashedPwd
    };

    pool.query('INSERT INTO users SET ?', userData, async (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
           return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: err.message });
      }

      const member = {
        id: result.insertId,
        name: userData.full_name,
        email: userData.email,
        age: Number(age || 0),
        role: role === 'organizer' ? 'organizer' : (role === 'admin' ? 'admin' : 'member')
      };

      const notificationText = formatMemberNotification(member, 'Nuevo miembro');
      await sendTelegramMessage(notificationText);

      res.status(201).json(member);
    });
  } catch (error) {
    res.status(500).json({ error: 'Error encrypting password' });
  }
});

router.put('/:id', async (req, res) => {
  const memberId = req.params.id;
  const { name, email, role } = req.body; // ignored age since it's not in db

  const data = {};
  if (name) data.full_name = name;
  if (email) data.email = email;
  if (role) {
    let userType = 'athlete';
    if (role === 'organizer') userType = 'organizer';
    if (role === 'admin') userType = 'admin';
    data.userType = userType;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Agrega al menos un campo para actualizar' });
  }

  pool.query('UPDATE users SET ? WHERE user_id = ?', [data, memberId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Miembro no encontrado' });

    pool.query('SELECT * FROM users WHERE user_id = ?', [memberId], async (err, rows) => {
      if (!err && rows.length > 0) {
        const member = mapUserToMember(rows[0]);
        const notificationText = formatMemberNotification(member, 'Miembro actualizado');
        await sendTelegramMessage(notificationText);
        res.json(member);
      } else {
        res.json({ message: 'User updated' });
      }
    });
  });
});

router.delete('/:id', async (req, res) => {
  const memberId = req.params.id;

  pool.query('SELECT * FROM users WHERE user_id = ?', [memberId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Miembro no encontrado' });

    const deletedMember = mapUserToMember(rows[0]);

    pool.query('DELETE FROM user_profile WHERE user_id = ?', [memberId], (err1) => {
      if (err1) console.error('Error deleting user_profile:', err1);
      
      pool.query('DELETE FROM users WHERE user_id = ?', [memberId], async (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const notificationText = `Miembro eliminado:\n<b>${deletedMember.name}</b> (ID: ${memberId})`;
        await sendTelegramMessage(notificationText);

        res.json({ message: 'Eliminado correctamente' });
      });
    });
  });
});

module.exports = router;
