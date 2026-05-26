# 🚀 AeroChat Backend - Guía de Instalación y Ejecución

Backend FastAPI que integra un agente conversacional de Azure AI Foundry con tu aplicación web de aeronáutica.

---

## 📋 Requisitos Previos

1. **Python 3.9+** instalado en tu sistema
   ```bash
   python --version  # Verificar versión
   ```

2. **Acceso a Azure AI Foundry** con:
   - Un recurso "Azure AI Project" creado
   - Un modelo desplegado (ej. gpt-4o, gpt-4-turbo)
   - Connection String del recurso
   - Nombre del deployment

3. **Credenciales de Azure CLI** configuradas localmente
   ```bash
   az login  # Si no está autenticado
   ```

---

## 🔐 Paso 1: Obtener Credenciales de Azure

### 1.1 Obtener Connection String

1. Ve a [Azure Portal](https://portal.azure.com)
2. Busca y abre tu recurso **"Azure AI Project"** (o crea uno nuevo)
3. En el panel izquierdo, selecciona **"Settings"**
4. Copia la **"Connection String"** (formato: `<subscription-id>;<resource-group>;<project-name>`)

### 1.2 Obtener Nombre del Deployment

1. En el mismo recurso, ve a **"Model Deployments"** (o similar, según tu versión de Azure)
2. Verifica que tienes un modelo desplegado (ej. "gpt-4o", "gpt-4-turbo")
3. Copia el **nombre exacto del deployment**

---

## 📝 Paso 2: Configurar Variables de Entorno

### 2.1 Crear archivo `.env`

En la carpeta `backend/`, crea un archivo llamado **`.env`** (sin punto al inicio en Windows si está oculto):

```bash
# Navega a la carpeta backend
cd tarea1/backend

# Copia el template y edítalo
cp .env.example .env

# Abre el archivo en tu editor favorito
```

### 2.2 Llenar las Credenciales

Edita `backend/.env` con tus valores reales:

```env
AZURE_AI_PROJECT_CONNECTION_STRING=<pega-aqui-tu-connection-string>
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:3000
```

**Ejemplo completo:**
```env
AZURE_AI_PROJECT_CONNECTION_STRING=12345678-1234-1234-1234-123456789012;my-resource-group;my-ai-project
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:3000
```

### 2.3 Verificar .gitignore

Asegúrate de que `.env` **NO se commitee** a Git:

En la raíz del proyecto (`tarea1/.gitignore`), agrega:
```
backend/.env
```

---

## 🔧 Paso 3: Instalar Dependencias Python

### 3.1 Crear Virtual Environment (RECOMENDADO)

```bash
# Navega a la carpeta backend
cd tarea1/backend

# Crear virtual environment
python -m venv venv

# Activar virtual environment
# En macOS/Linux:
source venv/bin/activate

# En Windows:
venv\Scripts\activate
```

Verás algo como `(venv)` al inicio de la línea si está activado.

### 3.2 Instalar Dependencias

```bash
# Asegúrate de estar en backend/ con venv activado
pip install -r requirements.txt
```

Espera a que termine (pueden ser unos minutos).

---

## ✅ Paso 4: Verificar Configuración

Antes de ejecutar el servidor, verifica que todo esté correcto:

```bash
# Estar en backend/ con venv activado

# Probar importar azure-ai-projects
python -c "from azure.ai.projects import AIProjectClient; print('✅ Azure SDK OK')"

# Probar que .env se carga correctamente
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(f'Connection String: {os.getenv(\"AZURE_AI_PROJECT_CONNECTION_STRING\")[:20]}...' if os.getenv('AZURE_AI_PROJECT_CONNECTION_STRING') else '❌ NO ENCONTRADO')"
```

---

## 🚀 Paso 5: Ejecutar el Servidor

```bash
# Asegúrate de estar en backend/ con venv activado

# Opción A: Con auto-reload (desarrollo)
python -m uvicorn main:app --reload --port 8000

# Opción B: Sin auto-reload (producción)
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Deberías ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
✅ Cliente Azure AI inicializado correctamente
```

---

## 🌐 Paso 6: Verificar que el Backend Funciona

En otra terminal, prueba los endpoints:

```bash
# Health check
curl http://localhost:8000/health

# Respuesta esperada:
# {"status":"ok","backend":"AeroChat","azure_deployment":"gpt-4o"}
```

Si ves `{"status":"ok"}`, ¡el backend está listo! ✅

---

## 🎨 Paso 7: Ejecutar el Frontend

En otra terminal, navega a la raíz y ejecuta el servidor Node.js (para los uploads):

```bash
cd tarea1

# Si aún no has instalado dependencias Node
npm install

# Ejecutar servidor
npm start
```

Deberías ver:
```
Server running at http://localhost:3000
```

---

## 📱 Paso 8: Probar el Chatbot

1. Abre el navegador: `http://localhost:3000`
2. Verás un botón 💬 en la esquina inferior derecha
3. Haz clic para abrir el chat
4. Escribe una pregunta sobre aviones, ej:
   - "¿Qué es un A380?"
   - "¿Cómo funciona el vuelo supersónico?"
   - "¿Cuál es la diferencia entre un avión comercial y uno privado?"
5. El chatbot debería responder en 1-3 segundos

---

## ⚠️ Troubleshooting

### Error: "No module named 'azure'"
```bash
# Asegúrate de haber instalado dependencias en el venv
pip install -r requirements.txt
```

### Error: "AZURE_AI_PROJECT_CONNECTION_STRING not found"
- Verifica que `.env` existe en `backend/`
- Verifica que la ruta a `.env` es correcta
- No uses comillas alrededor del valor en `.env`

### Error: "Connection refused" al acceder a `http://localhost:8000`
- Verifica que el servidor FastAPI está ejecutándose
- Verifica que estás usando puerto 8000 (o el que configuraste)
- En Windows, puede que necesites abrir el puerto en el firewall

### Error: CORS "No 'Access-Control-Allow-Origin' header"
- Verifica que `FRONTEND_URL` en `.env` coincide con donde corre el frontend
- Por defecto es `http://localhost:3000`

### El chatbot no responde o tarda mucho
- Verifica que las credenciales de Azure son correctas
- Verifica que el deployment `gpt-4o` existe en tu recurso
- Intenta hacer `curl http://localhost:8000/health` para revisar estado del cliente

---

## 📂 Estructura de Archivos

```
backend/
├── main.py              ← Servidor FastAPI
├── requirements.txt     ← Dependencias Python
├── .env                 ← Credenciales (NO comitear)
├── .env.example         ← Template de .env
└── venv/                ← Virtual environment (crear con venv)
    ├── bin/
    ├── lib/
    └── ...
```

---

## 🔄 Flujo de Comunicación

```
Cliente (HTML/JS en localhost:3000)
    ↓ fetch POST /api/chat/init
Backend FastAPI (localhost:8000)
    ↓ crea thread
    ↑ retorna thread_id
    
Cliente envía mensaje
    ↓ fetch POST /api/chat/message
Backend
    ↓ AIProjectClient.create_message()
    ↓ AIProjectClient.create_run()
    ↓ wait_on_run()
    ↓ list_messages()
    ↑ retorna agent_response
Cliente muestra respuesta
```

---

## 📊 Logs y Debugging

El servidor produce logs detallados:

```
INFO:     Inicializando Azure AI Projects Client...
✅ Cliente Azure AI inicializado correctamente
📨 Mensaje recibido para thread abc123: "¿Qué es un..."
✅ Mensaje agregado al thread: msg456
⏳ Run iniciado: run789, esperando respuesta...
✅ Run completado: completed
🤖 Respuesta del agente: "Un avión es una aeronave que..."
```

Para debugging, puedes editar `main.py` y cambiar el nivel de logging:
```python
logging.basicConfig(level=logging.DEBUG)  # Más verbose
```

---

## 🛑 Detener Servidores

```bash
# En cada terminal donde corre un servidor:
# Presiona: Ctrl + C
```

Luego desactiva el venv:
```bash
deactivate
```

---

## 🚀 Deployment a Producción (FUTURO)

Para desplegar el backend a Azure (ej. Azure Container Apps, Azure Functions):

1. Crear `Dockerfile` basado en `python:3.11-slim`
2. Usar Azure Container Registry para almacenar imagen
3. Desplegar a Azure Container Apps o similar
4. Usar secrets de Azure para `.env`

Documentación: https://learn.microsoft.com/en-us/azure/app-service/quickstart-python

---

## 📞 Soporte

Si tienes problemas:

1. Verifica los logs en la terminal
2. Verifica que las credenciales de Azure son correctas
3. Prueba `curl http://localhost:8000/health`
4. Revisa la sección **Troubleshooting** arriba
5. Consulta la documentación de Azure AI Foundry: https://learn.microsoft.com/azure/ai-services/agents/

---

**¡Listo! Tu AeroChat está configurado y listo para usar.** 🎉
