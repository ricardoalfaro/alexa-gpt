# AGENTS.md — Contexto Operativo y Arquitectura para Agentes de IA

Este archivo está diseñado específicamente para que cualquier agente de IA o desarrollador que tome este proyecto entienda **dónde estamos**, **qué decisiones se han tomado**, **por qué se diseñó de esta manera** y **cuáles son las reglas operativas críticas**.

---

## 1. Misión del Proyecto
Construir una **Alexa Custom Skill experimental y privada** para uso personal en dispositivos Amazon Echo, actuando como una interfaz de voz natural para múltiples Large Language Models (inicialmente OpenAI y Google Gemini), desacoplando totalmente la inteligencia de la plataforma de Alexa.

---

## 2. Restricciones Críticas de Alexa ASK (2026) que Gobiernan este Código
No alterar estas decisiones sin consultar la documentación oficial de ASK:
1. **Timeout del endpoint de ~8 segundos**:
   - Alexa corta la conexión tras ~8 segundos si no recibe respuesta.
   - Las *Progressive Responses* dan feedback sonoro intermedio pero **no extienden** el tiempo total.
   - *Regla*: el backend aplica un deadline defensivo de generación (~6.5s). Si el LLM no termina, el backend responde con los párrafos ya generados, pregunta "¿Quieres que continúe?" y continúa generando el resto en segundo plano.
2. **Límite de `outputSpeech`**:
   - 8000 caracteres máximo por respuesta.
   - Fragmentamos respuestas largas en chunks semánticos (oraciones/párrafos completos) de ~1200 a 2000 caracteres con margen para tags SSML.
3. **Invocación y Nombres de Skill en Español**:
   - "Alexa, una pregunta" **no** es un nombre de invocación válido bajo las reglas de Amazon (prohibidos artículos en nombres de dos palabras y prohibidas conjugaciones de "preguntar").
   - Estrategia: Nombre de invocación formal (ej. `sabio digital`) + Rutina en la app Alexa con disparador por voz `"una pregunta"` que abre la skill.
4. **Captura de Lenguaje Libre (`AMAZON.SearchQuery`)**:
   - Requiere carrier phrases en los sample utterances generales (`explícame {query}`), pero en respuestas con directiva `Dialog.ElicitSlot`, los *slot samples* permiten capturar `{query}` directo sin carrier phrase.
   - Todo slot captura texto ASR, no audio ni transcripciones sin procesar.

---

## 3. Estado Actual de la Implementación
- **Fase actual**: Construcción del Core del Backend (Etapas 2 a 8).
- **Herramientas base**:
  - Runtime: Node.js 22 LTS (ES Modules nativo).
  - Lenguaje: TypeScript 5.8 (estricto).
  - Framework HTTP: Fastify 5.
  - SDK Alexa: `ask-sdk-core` + `ask-sdk-model`.
  - Pruebas: Vitest.
  - Git branch: `main` (rastreando `origin/main` en `git@github.com:ricardoalfaro/alexa-gpt.git`).

---

## 4. Mapa de Arquitectura y Componentes
```
src/
├── config.ts                    # Carga y tipado estricto de variables de entorno (.env)
├── server.ts                    # Servidor Fastify, rutas HTTP y shutdown ordenado
├── logger.ts                    # Logger estructurado con enmascaramiento de PII
│
├── nlu/
│   ├── providerDetector.ts      # Extrae proveedor explícito ("con Gemini...", "usa ChatGPT...")
│   ├── controlCommandDetector.ts# Detecta comandos de flujo ("sí", "sigue", "para", "repite")
│   └── responseModeDetector.ts  # Clasifica modo 'concise' vs 'narrative' (cuentos, historias)
│
├── providers/
│   ├── aiProvider.ts            # Interface AIProvider, AIRequest, AIResponse
│   ├── providerRegistry.ts      # Registro y resolución de proveedores activos
│   ├── openaiProvider.ts        # Implementación OpenAI con streaming y timeout
│   └── geminiProvider.ts        # Implementación Google Gemini con streaming
│
├── router/
│   ├── modelRouter.ts           # Enrutamiento basado en estrategias extensibles
│   └── strategies/              # ExplicitProviderStrategy, DefaultProviderStrategy
│
├── conversation/
│   ├── conversationManager.ts   # Contexto multivuelta desacoplado de la sesión de Alexa
│   └── store/
│       ├── conversationStore.ts # Interface abstracta (get, save, delete)
│       └── inMemoryStore.ts     # Implementación en memoria con TTL (30 min)
│
├── longform/
│   ├── longResponseManager.ts   # Manejo de estados de respuesta paginada
│   └── semanticChunker.ts       # Particionado sin romper oraciones ni etiquetas SSML
│
├── voice/
│   ├── format/
│   │   ├── voiceResponseFormatter.ts # Remueve Markdown, URLs, caracteres no fonéticos
│   │   └── ssmlSanitizer.ts          # Escapado XML y sanitizado de SSML
│   └── alexa/
│       ├── alexaAdapter.ts      # Adaptador Fastify <-> ASK SDK RequestHandler
│       ├── handlers/            # LaunchHandler, AskIntentHandler, ControlHandlers, etc.
│       └── responseBuilder.ts   # Generación de respuestas ElicitSlot y ShouldEndSession
│
└── orchestrator/
    └── aiOrchestrator.ts        # Puente neutral entre interfaces (HTTP / Alexa) y los LLM
```

---

## 5. Principios de Diseño Obligatorios para Agentes
1. **Alexa no conoce a los proveedores**: Alexa solo interactúa con `AIOrchestrator`. Los tipos de Alexa no deben filtrarse hacia `AIProvider`.
2. **Separación de Sesión vs. Conversación**: Una sesión de Alexa puede cerrarse por inactividad de micrófono (~8-10s), pero la conversación en el backend debe persistir en `ConversationManager` indexada por `userId`/`personId` durante el TTL configurado (por defecto 30 minutos).
3. **Seguridad y Privacidad**:
   - Nunca loguear `query` ni respuestas del LLM cuando `LOG_PROMPTS=false`.
   - Anonimizar `userId` y `sessionId` en logs mediante hashing (SHA-256 truncado).
   - Ninguna API Key debe guardarse en repositorios ni imprimirse en pantalla.
4. **Respuestas pensadas para el oído**:
   - Cero markdown (`**negrita**`, `# títulos`, `- listas`, etc.).
   - Números y signos legibles de forma natural.

---

## 6. Siguientes Pasos Inmediatos
1. Implementar `src/nlu/` (`providerDetector.ts`, `controlCommandDetector.ts`, `responseModeDetector.ts`).
2. Implementar `src/voice/format/` (`voiceResponseFormatter.ts` y sanitizador SSML).
3. Implementar `src/conversation/` y `src/longform/`.
4. Implementar `src/providers/` (`OpenAIProvider`, `GeminiProvider`) y `src/router/`.
5. Implementar `src/orchestrator/aiOrchestrator.ts`.
6. Implementar endpoints en `src/server.ts` (`POST /ask` y `POST /alexa`).
7. Escribir suite de pruebas en `test/` y verificar con `npm test`.
