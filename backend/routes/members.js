const express = require('express');
const https = require('https');

const router = express.Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const members = new Map([
  [1, { id: 1, name: 'Ana García', email: 'ana@uni.edu', age: 22, role: 'member' }],
  [2, { id: 2, name: 'Carlos López', email: 'carlos@uni.edu', age: 23, role: 'organizer' }]
]);
let nextId = 3;

function sendTelegramMessage(text) {
  return new Promise((resolve) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('Telegram credentials not configured. Skipping notification.');
      return resolve(false);
    }

    const payload = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML'
    });

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      requestOptions,
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.error('Telegram API error:', res.statusCode, body);
            resolve(false);
          }
        });
      }
    );

    req.on('error', (error) => {
      console.error('Telegram request failed:', error);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

function createMemberPayload(data) {
  return {
    id: nextId,
    name: data.name,
    email: data.email || '',
    age: Number(data.age || 0),
    role: data.role === 'organizer' ? 'organizer' : 'member'
  };
}

function formatMemberNotification(member, action) {
  const roleLabel = member.role === 'organizer' ? 'Organizador' : 'Miembro';
  return `${action} de club:\n<b>${member.name}</b>\nRol: ${roleLabel}\nEmail: ${member.email}\nEdad: ${member.age}`;
}

router.get('/', (req, res) => {
  res.json(Array.from(members.values()));
});

router.get('/:id', (req, res) => {
  const memberId = Number(req.params.id);
  if (Number.isNaN(memberId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const member = members.get(memberId);
  if (!member) {
    return res.status(404).json({ error: 'No encontrado' });
  }

  res.json(member);
});

router.post('/', async (req, res) => {
  const { name, email, age, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: "Campo 'name' requerido" });
  }

  const member = createMemberPayload({ name: name.trim(), email, age, role });
  members.set(nextId, member);
  nextId += 1;

  const notificationText = formatMemberNotification(member, 'Nuevo miembro');
  await sendTelegramMessage(notificationText);

  res.status(201).json(member);
});

router.put('/:id', async (req, res) => {
  const memberId = Number(req.params.id);
  if (Number.isNaN(memberId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const member = members.get(memberId);
  if (!member) {
    return res.status(404).json({ error: 'Miembro no encontrado' });
  }

  const { name, email, age, role } = req.body;
  if (name) member.name = name;
  if (email) member.email = email;
  if (typeof age !== 'undefined') member.age = Number(age);
  if (role) member.role = role === 'organizer' ? 'organizer' : 'member';

  const notificationText = formatMemberNotification(member, 'Miembro actualizado');
  await sendTelegramMessage(notificationText);

  res.json(member);
});

router.delete('/:id', async (req, res) => {
  const memberId = Number(req.params.id);
  if (Number.isNaN(memberId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (!members.has(memberId)) {
    return res.status(404).json({ error: 'Miembro no encontrado' });
  }

  const deletedMember = members.get(memberId);
  members.delete(memberId);

  const notificationText = `Miembro eliminado:\n<b>${deletedMember.name}</b> (ID: ${memberId})`;
  await sendTelegramMessage(notificationText);

  res.json({ message: 'Eliminado correctamente' });
});

module.exports = router;
