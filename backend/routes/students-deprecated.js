const express = require('express');
const https = require('https');

const router = express.Router();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const students = new Map([
  [1, { id: 1, name: 'Ana García', email: 'ana@uni.edu', age: 22 }],
  [2, { id: 2, name: 'Carlos López', email: 'carlos@uni.edu', age: 23 }]
]);
let nextId = 3;

function sendTelegramMessage(text) {
  return new Promise((resolve, reject) => {
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

function createStudentPayload(data) {
  return {
    id: nextId,
    name: data.name,
    email: data.email || '',
    age: Number(data.age || 0)
  };
}

router.get('/', (req, res) => {
  res.json(Array.from(students.values()));
});

router.get('/:id', (req, res) => {
  const studentId = Number(req.params.id);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const student = students.get(studentId);
  if (!student) {
    return res.status(404).json({ error: 'No encontrado' });
  }

  res.json(student);
});

router.post('/', async (req, res) => {
  const { name, email, age } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: "Campo 'name' requerido" });
  }

  const student = createStudentPayload({ name: name.trim(), email, age });
  students.set(nextId, student);
  nextId += 1;

  const notificationText = `Nuevo estudiante creado:\n<b>${student.name}</b>\nEmail: ${student.email}\nEdad: ${student.age}`;
  await sendTelegramMessage(notificationText);

  res.status(201).json(student);
});

router.put('/:id', async (req, res) => {
  const studentId = Number(req.params.id);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  const student = students.get(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Estudiante no encontrado' });
  }

  const { name, email, age } = req.body;
  if (name) student.name = name;
  if (email) student.email = email;
  if (typeof age !== 'undefined') student.age = Number(age);

  const notificationText = `Estudiante actualizado:\n<b>${student.name}</b>\nEmail: ${student.email}\nEdad: ${student.age}`;
  await sendTelegramMessage(notificationText);

  res.json(student);
});

router.delete('/:id', async (req, res) => {
  const studentId = Number(req.params.id);
  if (Number.isNaN(studentId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (!students.has(studentId)) {
    return res.status(404).json({ error: 'Estudiante no encontrado' });
  }

  const deletedStudent = students.get(studentId);
  students.delete(studentId);

  const notificationText = `Estudiante eliminado:\n<b>${deletedStudent.name}</b> (ID: ${studentId})`;
  await sendTelegramMessage(notificationText);

  res.json({ message: 'Eliminado correctamente' });
});

module.exports = router;
