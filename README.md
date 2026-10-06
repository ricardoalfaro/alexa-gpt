# Alexa GPT — Asistente de Voz Inteligente para Amazon Echo

Convierte cualquier dispositivo Amazon Echo en una interfaz de voz natural para múltiples modelos de inteligencia artificial (**OpenAI** y **Google Gemini**), manteniendo la conversación en contexto, respuestas optimizadas para ser escuchadas y soporte para narraciones largas.

---

## 🏛️ 1. Arquitectura de Alto Nivel

```
Usuario
   ↓ (Voz en Amazon Echo)
Alexa Custom Skill (Micrófono, Reconocimiento ASR, Reproducción TTS)
   ↓ (HTTPS POST /alexa)
Backend Fastify (TypeScript)
   ↓
AIOrchestrator
   ├── NLU (ProviderDetector / ControlCommandDetector / ResponseModeDetector)
   ├── ModelRouter (OpenAI vs. Gemini)
   ├── ConversationManager (Memoria con TTL de 30 minutos)
   └── LongResponseManager (Paginación de respuestas extensas: sí / sigue / repite / para)
   ↓
API de OpenAI / API de Google Gemini
   ↓
VoiceResponseFormatter & SSML Sanitizer (Sin Markdown ni URLs, ritmo natural)
   ↓
Alexa habla la respuesta (Micrófono permanece abierto para continuar la conversación)
```

---

## ⚙️ 2. Requisitos Previos
1. **Node.js** 22 LTS o superior (`node -v`).
2. **Cuenta de Desarrollador de Amazon**: [developer.amazon.com](https://developer.amazon.com/alexa/console/ask) (gratuita).
3. **Dispositivo Amazon Echo** configurado con la misma cuenta de Amazon.
4. Claves de API de **OpenAI** y/o **Google Gemini**.
5. Herramienta para túnel HTTPS local: `cloudflared` o `ngrok` (para conectar Alexa a tu Mac en desarrollo).

---

## 🚀 3. Puesta en Marcha Local

### Paso 1: Clonar e Instalar Dependencias
```bash
git clone git@github.com:ricardoalfaro/alexa-gpt.git
cd alexa-gpt
npm install
```

### Paso 2: Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita `.env` con tus claves:
```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
DEFAULT_AI_PROVIDER=openai
PORT=3000
CONVERSATION_TTL_MINUTES=30
LOG_PROMPTS=false
```

### Paso 3: Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
El servidor arrancará en `http://localhost:3000`.

### Paso 4: Probar el Endpoint HTTP Independiente (`POST /ask`)
Puedes probar el backend sin Alexa ejecutando en otra terminal:
```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Cuándo fue la independencia de Chile?"}'
```

O solicitando un modelo específico:
```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "Con Gemini explícame qué es Open Finance"}'
```

---

## 🎙️ 4. Configuración en Alexa Developer Console

### Paso 1: Crear la Custom Skill
1. Entra a la [Consola de Desarrollador de Alexa](https://developer.amazon.com/alexa/console/ask).
2. Haz clic en **Create Skill**.
3. **Skill name**: `Alexa GPT`.
4. **Primary locale**: Selecciona el idioma de tu Echo (ej. **Spanish (US)**).
5. **Model**: **Custom**.
6. **Hosting**: **Provision your own** (usarás tu propio servidor).

### Paso 2: Importar el Modelo de Interacción
1. En el menú lateral izquierdo, ve a **Interaction Model** → **JSON Editor**.
2. Copia y pega el contenido íntegro del archivo local:
   `skill-package/interactionModels/custom/es-US.json`
3. Haz clic en **Save Model** y luego en **Build Model**.

### Paso 3: Exponer tu Servidor con un Túnel HTTPS
En una terminal aparte, levanta un túnel público para tu puerto 3000:

- **Con ngrok:**
  ```bash
  ngrok http 3000
  ```
- **Con Cloudflare Tunnels (`cloudflared`):**
  ```bash
  cloudflared tunnel --url http://localhost:3000
  ```

Copia la URL pública HTTPS resultante (ej. `https://xxxx.ngrok-free.app` o `https://xxxx.trycloudflare.com`).

### Paso 4: Configurar el Endpoint en Alexa
1. En la consola de Alexa, ve a **Endpoint**.
2. Selecciona **HTTPS**.
3. En **Default Region**, pega tu URL con la ruta `/alexa`:
   ```
   https://xxxx.ngrok-free.app/alexa
   ```
4. En el menú desplegable de certificados SSL, selecciona:
   **"My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority"**.
5. Haz clic en **Save Endpoints**.

---

## 📱 5. Activación y Prueba en tu Dispositivo Echo

### En la Consola:
1. Ve a la pestaña **Test**.
2. Cambia la opción **Test is disabled for this skill** a **Development**.
3. En el simulador puedes escribir: `"abre sabio digital"` y responderá `"Dime."`.

### En tu Amazon Echo Real:
1. Asegúrate de que tu Echo tenga como idioma el mismo configurado en la skill (ej. Español de Estados Unidos).
2. Di: **“Alexa, abre sabio digital.”**
3. Alexa responderá: **“Dime.”** con el anillo azul encendido.
4. Haz tu pregunta: **“¿Cuándo fue la independencia de Chile?”**.
5. Al terminar, el micrófono se volverá a encender automáticamente para preguntas contextuales de seguimiento: **“¿Y quién gobernaba en esa época?”**.

---

## 💡 6. Creación del Atajo "Alexa, una pregunta" (Opcional vía Rutinas)

Debido a que las políticas oficiales de Amazon prohíben palabras reservadas como "pregunta" dentro del invocation name directo de una skill, puedes configurar un atajo natural mediante la app móvil de Alexa:

1. Abre la app **Amazon Alexa** en tu smartphone.
2. Ve a **Más** (More) → **Rutinas** (Routines) → **+** (Nueva Rutina).
3. **Cuando** (When): Selecciona **Voz** e ingresa la frase:
   `"una pregunta"`
4. **Agregar acción**:
   - Selecciona **Personalizado** (Custom).
   - Escribe exactamente: `abre sabio digital`.
5. Guarda la rutina.
6. Ahora al decir **“Alexa, una pregunta”**, Alexa ejecutará la skill y abrirá el micrófono con **“Dime.”**.

---

## 🧪 7. Pruebas Automatizadas
Para verificar el funcionamiento de los componentes centrales:
```bash
npm test
```
Ejecutará la suite de pruebas unitarias cubriendo:
- Detección de proveedor por lenguaje natural (`ProviderDetector`).
- Comandos de control conversacional (`ControlCommandDetector`).
- Formateo y sanitizado SSML (`VoiceResponseFormatter` y `SsmlSanitizer`).
- Particionado y navegación de respuestas largas (`LongResponseManager`).
- Memoria y persistencia de diálogo (`ConversationManager`).
