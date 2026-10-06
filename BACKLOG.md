# BACKLOG — Alexa GPT

Este documento contiene las ideas, mejoras y funcionalidades planificadas para evolucionar el asistente de voz más allá del MVP.

---

## 🚀 Estado Actual: MVP (Fase 1)
- [x] Investigación de restricciones oficiales ASK 2026 (`AMAZON.SearchQuery`, 8000 caracteres, timeouts de ~8s, `ElicitSlot`).
- [x] Scaffolding Fastify + TypeScript + Vitest + ASK SDK.
- [x] Repositorio Git y sincronización inicial con GitHub.
- [ ] Enrutador de modelos por lenguaje natural (`ProviderDetector`).
- [ ] Soporte inicial multi-proveedor (OpenAI + Gemini) con streaming y deadline defensivo.
- [ ] Formateador y sanitizador de voz para SSML (`VoiceResponseFormatter`).
- [ ] Manejo de contexto conversacional desacoplado (`ConversationManager` + `InMemoryConversationStore` con TTL de 30 min).
- [ ] Manejo y navegación de respuestas extensas (`LongResponseManager`: sí/sigue/repite/anterior/para).
- [ ] Gateway Alexa Custom Skill con `Dialog.ElicitSlot` y loop conversacional continuo.
- [ ] Endpoint de prueba HTTP independiente: `POST /ask`.
- [ ] Tests automatizados unitarios y de integración.
- [ ] Guía paso a paso en `README.md`.

---

## 📋 Fase 2: Robustez, Hosting y Persistencia
- [ ] **Persistencia permanente de sesiones**:
  - Reemplazar `InMemoryConversationStore` por adaptador Redis o PostgreSQL / Supabase para mantener sesiones activas ante reinicios del backend.
- [ ] **Despliegue Serverless / Cloud**:
  - Configurar Dockerfile optimizado.
  - Opciones de hosting continuo: AWS Lambda (con AWS API Gateway o función Lambda directa para Alexa) / Fly.io / Render / Railway.
- [ ] **Verificación criptográfica estricta de solicitudes Alexa**:
  - Activación por defecto de validación de firma (`Signature-256`, cert chain) y timestamps (<150s) para modo de producción.
- [ ] **Métricas y observabilidad avanzada**:
  - Dashboard de latencias (TTFB, generación de modelo, tiempo total Alexa).
  - Alertas ante agotamiento de cuota o timeouts de proveedores de IA.

---

## 🧠 Fase 3: Proveedores de IA Adicionales
- [ ] **Anthropic Provider**: Integración con Claude 3.5 Sonnet / Haiku.
- [ ] **Perplexity Provider**: Respuestas con búsqueda web integrada en tiempo real.
- [ ] **Local Model Provider**: Conexión con modelos locales vía Ollama o vLLM (para consultas privadas sin costo de API).
- [ ] **Model Router Inteligente**:
  - Clasificación automática del tipo de consulta (consulta rápida/económica vs. razonamiento complejo vs. búsqueda en tiempo real) sin necesidad de que el usuario mencione el proveedor explícitamente.

---

## 🛠️ Fase 4: Voice Gateway extensible y Tools (Agentes)
- [ ] **Capacidades de búsqueda y datos en tiempo real**:
  - Integración de herramienta de búsqueda web (Google Search / Brave Search / Tavily) activada por el orquestador.
  - Noticias y clima en tiempo real.
- [ ] **Integraciones personales**:
  - Calendario (Google Calendar / Microsoft 365).
  - Correo electrónico (resumen matutino por voz).
  - Domótica avanzada (Home Assistant bridge).
- [ ] **Memoria a largo plazo / RAG**:
  - Recuperación de preferencias del usuario y hechos personales almacenados en base de datos vectorial (Chroma / Pinecone / pgvector).

---

## 🔊 Fase 5: Experiencia Multimodal y Audio Enriquecido
- [ ] **Soporte multimodal (Echo Show / Pantallas con APL)**:
  - Renderizado visual de respuestas en dispositivos con pantalla mediante Alexa Presentation Language (APL).
  - Visualización de títulos, proveedor de IA utilizado y fragmentos de texto complementarios.
- [ ] **AudioPlayer / TTS Externo opcional**:
  - Para narraciones o cuentos generados: síntesis de voz hiperrealista vía ElevenLabs o OpenAI TTS transmitida mediante `AudioPlayer.Play`.
