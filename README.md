# Sportanet

## Descripción del Proyecto

Sportanet es una plataforma web diseñada para facilitar la búsqueda, gestión y participación en eventos deportivos. Permite a los usuarios registrarse, crear perfiles personalizados, explorar eventos disponibles e inscribirse en actividades deportivas de su interés.

## Tecnologías Usadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Diseño responsive con Flexbox y Grid
- **JavaScript** - Lógica de aplicación y validaciones
- **Fetch API** - Comunicación con el backend

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL2** - Driver de base de datos
- **bcrypt** - Encriptación de contraseñas
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **CORS** - Control de acceso entre dominios

### Base de Datos
- **MySQL** - Sistema de gestión de base de datos relacional

## Cómo Ejecutarlo

### Requisitos Previos
- Node.js (v14 o superior)
- MySQL Server ejecutándose
- MySQL Workbench instalado
- Un navegador web moderno

### Pasos de Instalación

#### 1. Clonar el repositorio
```bash
git clone https://github.com/JovenDan/Sportanet-prototype.git
cd Sportanet-prototype
```

#### 2. Configurar la base de datos
Para configurar la base de datos, sigue estos pasos:

1. **Instalar MySQL Server y MySQL Workbench**:
   - Descarga e instala MySQL Server desde el sitio oficial de MySQL (https://dev.mysql.com/downloads/mysql/).
   - Descarga e instala MySQL Workbench desde el mismo sitio (https://dev.mysql.com/downloads/workbench/).
   - Durante la instalación, configura una contraseña para el usuario root de MySQL.

2. **Crear la base de datos**:
   - Abre MySQL Workbench.
   - Conéctate a tu servidor MySQL local (generalmente con usuario 'root' y la contraseña configurada).
   - Crea una nueva base de datos llamada `sportanet_v1` con codificación UTF-8 (utf8mb4).

3. **Importar el esquema de la base de datos**:
   - En MySQL Workbench, selecciona la base de datos `sportanet_v1`.
   - Ve a "Server" > "Data Import".
   - Selecciona "Import from Self-Contained File" y elige el archivo `database/sportanet_v1.sql` del repositorio.
   - Selecciona la base de datos de destino como `sportanet_v1`.
   - Ejecuta la importación para crear las tablas y datos iniciales.

#### 3. Instalar dependencias del backend
```bash
cd backend
npm install
```

#### 4. Iniciar el backend
```bash
node app.js
```
El servidor estará disponible en `http://localhost:3000`

#### 4.1 Configuración de APIs de miembros de club
- Crea un archivo `.env` en la carpeta `backend`
- Copia el contenido de `.env.example`
- Completa las variables:
  - `PORT=3000`
  - `JWT_SECRET=tu_secreto_jwt`
  - `TELEGRAM_BOT_TOKEN=tu_token_de_bot`
  - `TELEGRAM_CHAT_ID=tu_chat_id`

#### 4.2 Endpoints principales
- `GET /api/members` - Lista todos los miembros del club
- `GET /api/members/:id` - Obtiene un miembro por ID
- `POST /api/members` - Crea un miembro u organizador de club
- `PUT /api/members/:id` - Actualiza un miembro existente
- `DELETE /api/members/:id` - Elimina un miembro

#### 5. Abrir el frontend
- Abre `index.html` en el navegador o sirve los archivos con un servidor HTTP local
- La aplicación se conectará automáticamente al backend en `http://localhost:3000`

### Flujo de Uso
1. **Registrarse** - Crea una cuenta con tu nombre, email, teléfono y contraseña
2. **Iniciar Sesión** - Accede con tus credenciales
3. **Mi Perfil** - Visualiza y edita tu información personal o elimina tu cuenta
4. **Eventos** - Explora eventos deportivos disponibles
5. **Inscripción** - Participa en eventos de tu interés

---

## Equipo de Desarrollo

- **Heyder Ivan Ramos Rodriguez**
- **Daniel Gustavo Montañez**
- **Juherles Jesus Renia**
- **Danilo Jose Cantor**

**Grupo:** Tecnología en Desarrollo de Software  
**Universidad:** Universidad San Buenaventura
