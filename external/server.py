# rest_server.py
"""
Servidor RESTful para gestión de estudiantes.
Implementa un CRUD completo utilizando los métodos HTTP estándar.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class RESTHandler(BaseHTTPRequestHandler):
    """
    Manejador de peticiones HTTP para el servidor REST.
    Implementa todas las operaciones CRUD para estudiantes:
    - GET: Obtener estudiantes (todos o por ID)
    - POST: Crear nuevo estudiante
    - PUT: Actualizar estudiante existente
    - DELETE: Eliminar estudiante
    """
    
    # Base de datos en memoria (variable de clase)
    # Almacena estudiantes con estructura {id: {datos_estudiante}}
    students = {
        1: {"id": 1, "name": "Ana García", "email": "ana@uni.edu", "age": 22},
        2: {"id": 2, "name": "Carlos López", "email": "carlos@uni.edu", "age": 23}
    }
    next_id = 3  # Controla el próximo ID a asignar (autoincremental)
    
    def _send_json(self, data, status=200):
        """
        Método auxiliar para enviar respuestas en formato JSON.
        
        Args:
            data: Datos a serializar como JSON (dict o list)
            status: Código de estado HTTP (200, 201, 400, 404, etc.)
        """
        # Establece el código de estado
        self.send_response(status)
        
        # Cabeceras de la respuesta
        self.send_header('Content-Type', 'application/json')
        
        # Cabeceras CORS para permitir peticiones desde cualquier origen
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Finaliza las cabeceras
        self.end_headers()
        
        # Serializa los datos a JSON y los envía
        # ensure_ascii=False permite caracteres UTF-8 (tildes, eñes)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        """
        Maneja peticiones OPTIONS (pre-flight) para CORS.
        Los navegadores envían esto antes de ciertas peticiones para verificar permisos.
        """
        self.send_response(204)  # 204 No Content
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """
        Maneja peticiones GET.
        Endpoints:
        - GET /              : Verificación de conexión (endpoint raíz)
        - GET /students       : Lista todos los estudiantes
        - GET /students/{id}  : Obtiene un estudiante específico
        """
        if self.path == '/':
            # Endpoint raíz para verificar que el servidor está funcionando
            self._send_json({
                "message": "Servidor REST funcionando correctamente",
                "version": "1.0.0",
                "endpoints": {
                    "GET /": "Verificación de conexión",
                    "GET /students": "Listar todos los estudiantes",
                    "GET /students/{id}": "Obtener estudiante por ID",
                    "POST /students": "Crear nuevo estudiante",
                    "PUT /students/{id}": "Actualizar estudiante",
                    "DELETE /students/{id}": "Eliminar estudiante"
                }
            })
        elif self.path == '/students':
            # Devuelve la lista completa de estudiantes
            # Convierte el diccionario a lista de valores
            self._send_json(list(self.students.values()))
            
        elif self.path.startswith('/students/'):
            try:
                # Extrae el ID de la URL (último segmento después de /students/)
                student_id = int(self.path.split('/')[-1])
                
                # Busca el estudiante por ID
                student = self.students.get(student_id)
                
                if student:
                    # Si existe, lo devuelve
                    self._send_json(student)
                else:
                    # Si no existe, error 404
                    self._send_json({"error": "No encontrado"}, 404)
            except:
                # Si el ID no es un número válido, error 400
                self._send_json({"error": "ID inválido"}, 400)
        else:
            # Ruta no encontrada
            self._send_json({"error": "Endpoint no encontrado"}, 404)
    
    def do_POST(self):
        """
        Maneja peticiones POST para crear nuevos estudiantes.
        Endpoint:
        - POST /students : Crea un nuevo estudiante
        
        El cuerpo debe ser JSON con al menos el campo 'name'.
        Ejemplo: {"name": "Juan", "email": "juan@uni.edu", "age": 21}
        """
        if self.path == '/students':
            # Obtiene la longitud del cuerpo de la petición
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length == 0:
                self._send_json({"error": "Body vacío"}, 400)
                return
            
            # Lee el cuerpo de la petición
            post_data = self.rfile.read(content_length)
            
            try:
                # Intenta parsear el JSON
                data = json.loads(post_data)
            except:
                self._send_json({"error": "JSON inválido"}, 400)
                return
            
            # Validación: el campo 'name' es obligatorio
            if 'name' not in data:
                self._send_json({"error": "Campo 'name' requerido"}, 400)
                return
            
            # Crea el nuevo estudiante
            new_student = {
                "id": self.next_id,                    # ID autoincremental
                "name": data['name'],                   # Nombre (requerido)
                "email": data.get('email', ''),         # Email (opcional, por defecto vacío)
                "age": data.get('age', 0)               # Edad (opcional, por defecto 0)
            }
            
            # Guarda en la base de datos
            self.students[self.next_id] = new_student
            self.next_id += 1  # Incrementa para el próximo ID
            
            # Responde con 201 Created y el estudiante creado
            self._send_json(new_student, 201)
    
    def do_PUT(self):
        """
        Maneja peticiones PUT para actualizar estudiantes existentes.
        Endpoint:
        - PUT /students/{id} : Actualiza un estudiante específico
        
        El cuerpo puede incluir cualquier combinación de campos a actualizar.
        Ejemplo: {"name": "Nuevo Nombre", "age": 25}
        """
        if self.path.startswith('/students/'):
            try:
                # Extrae el ID de la URL
                student_id = int(self.path.split('/')[-1])
            except:
                self._send_json({"error": "ID inválido"}, 400)
                return
            
            # Verifica si el estudiante existe
            if student_id not in self.students:
                self._send_json({"error": "Estudiante no encontrado"}, 404)
                return
            
            # Obtiene la longitud del cuerpo
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self._send_json({"error": "Body vacío"}, 400)
                return
            
            # Lee y parsea el JSON
            put_data = self.rfile.read(content_length)
            try:
                data = json.loads(put_data)
            except:
                self._send_json({"error": "JSON inválido"}, 400)
                return
            
            # Actualización parcial: solo modifica los campos que vienen en la petición
            if 'name' in data:
                self.students[student_id]['name'] = data['name']
            if 'email' in data:
                self.students[student_id]['email'] = data['email']
            if 'age' in data:
                self.students[student_id]['age'] = data['age']
            
            # Devuelve el estudiante actualizado
            self._send_json(self.students[student_id])
    
    def do_DELETE(self):
        """
        Maneja peticiones DELETE para eliminar estudiantes.
        Endpoint:
        - DELETE /students/{id} : Elimina un estudiante específico
        """
        if self.path.startswith('/students/'):
            try:
                # Extrae el ID de la URL
                student_id = int(self.path.split('/')[-1])
            except:
                self._send_json({"error": "ID inválido"}, 400)
                return
            
            # Verifica si existe y elimina
            if student_id in self.students:
                del self.students[student_id]  # Elimina del diccionario
                self._send_json({"message": "Eliminado correctamente"})
            else:
                self._send_json({"error": "Estudiante no encontrado"}, 404)


if __name__ == '__main__':
    """
    Punto de entrada principal del servidor.
    Configura y arranca el servidor HTTP en localhost:3000.
    """
    
    # Crea el servidor en localhost:3000 con nuestro manejador
    server = HTTPServer(('localhost', 3000), RESTHandler)
    
    # Muestra información del servidor
    print("="*50)
    print("Servidor REST funcionando")
    print("="*50)
    print("GET    /                 - Verificación de conexión")
    print("GET    /students         - Lista todos los estudiantes")
    print("GET    /students/1       - Obtiene el estudiante con ID 1")
    print("POST   /students         - Crea un nuevo estudiante")
    print("PUT    /students/1       - Actualiza el estudiante con ID 1")
    print("DELETE /students/1       - Elimina el estudiante con ID 1")
    print("="*50)
    print("Conectado en http://localhost:3000")
    print("="*50)
    
    # Inicia el servidor (bucle infinito)
    server.serve_forever()