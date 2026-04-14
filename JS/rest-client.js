const CLIENT_BASE_URL = window.APP_STATE?.API_URL || 'http://localhost:3000';

function renderApiResult(data) {
    const result = document.getElementById('resultado');
    const error = document.getElementById('error-mensaje');
    if (!result) return;

    result.textContent = JSON.stringify(data, null, 2);
    if (error) error.textContent = '';
}

function renderApiError(message) {
    const result = document.getElementById('resultado');
    const error = document.getElementById('error-mensaje');
    if (result) result.textContent = message;
    if (error) error.textContent = message;
}

async function makeRequest(path, options = {}) {
    try {
        const url = `${CLIENT_BASE_URL}${path}`;
        const response = await fetch(url, options);
        const body = await response.json().catch(() => ({ message: 'No hay respuesta JSON' }));

        if (!response.ok) {
            renderApiError(`Error HTTP ${response.status}: ${body.error || body.message || 'Error desconocido'}`);
            return null;
        }

        renderApiResult(body);
        return body;
    } catch (error) {
        renderApiError(`Error de conexión: ${error.message}`);
        return null;
    }
}

async function getAllMembers() {
    await makeRequest('/api/members');
}

async function getMemberById() {
    const id = document.getElementById('getId')?.value || '';
    if (!id) {
        renderApiError('Ingresa un ID válido');
        return;
    }
    await makeRequest(`/api/members/${id}`);
}

async function createMember() {
    const member = {
        name: document.getElementById('postName')?.value || '',
        email: document.getElementById('postEmail')?.value || '',
        age: Number(document.getElementById('postAge')?.value || 0),
        role: document.getElementById('postRole')?.value || 'member'
    };

    await makeRequest('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
    });
}

async function updateMember() {
    const id = document.getElementById('putId')?.value || '';
    if (!id) {
        renderApiError('Ingresa el ID del miembro a actualizar');
        return;
    }

    const payload = {};
    const name = document.getElementById('putName')?.value;
    const email = document.getElementById('putEmail')?.value;
    const age = document.getElementById('putAge')?.value;
    const role = document.getElementById('putRole')?.value;

    if (name) payload.name = name;
    if (email) payload.email = email;
    if (age) payload.age = Number(age);
    if (role) payload.role = role;

    if (Object.keys(payload).length === 0) {
        renderApiError('Agrega al menos un campo para actualizar');
        return;
    }

    await makeRequest(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

async function deleteMember() {
    const id = document.getElementById('deleteId')?.value || '';
    if (!id) {
        renderApiError('Ingresa el ID del miembro a eliminar');
        return;
    }
    await makeRequest(`/api/members/${id}`, { method: 'DELETE' });
}

function attachRestClientEvents() {
    if (!document.getElementById('member-api-client')) return;

    document.getElementById('btn-get-all')?.addEventListener('click', getAllMembers);
    document.getElementById('btn-get-one')?.addEventListener('click', getMemberById);
    document.getElementById('btn-create')?.addEventListener('click', createMember);
    document.getElementById('btn-update')?.addEventListener('click', updateMember);
    document.getElementById('btn-delete')?.addEventListener('click', deleteMember);

    renderApiResult({ message: 'Cliente REST listo. Presiona un botón para comenzar.' });
}

document.addEventListener('DOMContentLoaded', attachRestClientEvents);
