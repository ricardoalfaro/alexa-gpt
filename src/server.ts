import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { AppLogger } from './logger.js';
import { ProviderRegistry } from './providers/providerRegistry.js';
import { OpenAIProvider } from './providers/openaiProvider.js';
import { GeminiProvider } from './providers/geminiProvider.js';
import { ModelRouter } from './router/modelRouter.js';
import { InMemoryConversationStore } from './conversation/inMemoryStore.js';
import { SupabaseConversationStore } from './conversation/supabaseStore.js';
import { ConversationStore } from './conversation/conversationStore.js';
import { ConversationManager } from './conversation/conversationManager.js';
import { LongResponseManager } from './longform/longResponseManager.js';
import { AIOrchestrator } from './orchestrator/aiOrchestrator.js';
import { registerAskRoute } from './http/askRoute.js';
import { registerAlexaRoute } from './voice/alexa/alexaAdapter.js';

export async function buildServer() {
  const config = loadConfig();
  const logger = new AppLogger(config.logPrompts);

  const app = Fastify({
    logger: {
      level: 'info'
    }
  });

  // 1. Instanciar proveedores
  const registry = new ProviderRegistry();
  const openAiProvider = new OpenAIProvider(config.openAiApiKey, config.openAiModel);
  const geminiProvider = new GeminiProvider(config.geminiApiKey, config.geminiModel);

  registry.register(openAiProvider);
  registry.register(geminiProvider);

  // 2. Router, Memoria (Supabase o InMemory) y Manejador de respuestas largas
  const router = new ModelRouter(registry);
  const convoStore: ConversationStore = (config.supabaseUrl && config.supabaseKey)
    ? new SupabaseConversationStore(config.supabaseUrl, config.supabaseKey)
    : new InMemoryConversationStore();

  const conversationManager = new ConversationManager(convoStore, config.conversationTtlMinutes);
  const longResponseManager = new LongResponseManager(config.conversationTtlMinutes);

  // 3. AIOrchestrator central
  const orchestrator = new AIOrchestrator({
    router,
    registry,
    conversationManager,
    longResponseManager,
    defaultProvider: config.defaultAiProvider,
    logger
  });

  // 4. Healthcheck
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      openai: openAiProvider.isConfigured(),
      gemini: geminiProvider.isConfigured()
    }
  }));

  // 5. Rutas
  registerAskRoute(app, orchestrator);
  registerAlexaRoute(app, orchestrator);

  return { app, config, logger };
}

// Inicializar servidor si se ejecuta directamente
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  try {
    const { app, config } = await buildServer();
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Alexa-GPT Gateway escuchando en el puerto ${config.port}`);
  } catch (err) {
    console.error('Error al arrancar el servidor:', err);
    process.exit(1);
  }
}
