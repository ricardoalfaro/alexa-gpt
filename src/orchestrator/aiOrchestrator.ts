import { ProviderId } from '../config.js';
import { ModelRouter } from '../router/modelRouter.js';
import { ProviderRegistry } from '../providers/providerRegistry.js';
import { ProviderDetector } from '../nlu/providerDetector.js';
import { ControlCommandDetector, ControlCommandType } from '../nlu/controlCommandDetector.js';
import { ResponseModeDetector, ResponseMode } from '../nlu/responseModeDetector.js';
import { VoiceResponseFormatter } from '../voice/format/voiceResponseFormatter.js';
import { ConversationManager } from '../conversation/conversationManager.js';
import { LongResponseManager } from '../longform/longResponseManager.js';
import { AppLogger } from '../logger.js';

export interface AskCommand {
  query: string;
  userKey: string;
  sessionId?: string;
  explicitProvider?: ProviderId;
  deadlineMs?: number;
}

export interface AssistantTurn {
  speechText: string;
  hasMore: boolean;
  provider: string;
  model: string;
  responseMode: ResponseMode;
  latencyMs: number;
  controlAction?: ControlCommandType;
}

export class AIOrchestrator {
  private router: ModelRouter;
  private registry: ProviderRegistry;
  private conversationManager: ConversationManager;
  private longResponseManager: LongResponseManager;
  private defaultProvider: 'openai' | 'gemini';
  private logger: AppLogger;

  constructor(options: {
    router: ModelRouter;
    registry: ProviderRegistry;
    conversationManager: ConversationManager;
    longResponseManager: LongResponseManager;
    defaultProvider: 'openai' | 'gemini';
    logger: AppLogger;
  }) {
    this.router = options.router;
    this.registry = options.registry;
    this.conversationManager = options.conversationManager;
    this.longResponseManager = options.longResponseManager;
    this.defaultProvider = options.defaultProvider;
    this.logger = options.logger;
  }

  async processTurn(cmd: AskCommand): Promise<AssistantTurn> {
    const start = Date.now();
    const userKey = cmd.userKey;
    const rawQuery = cmd.query.trim();

    // 1. Detectar si el usuario ejecutó un comando de control de flujo (ej. sí, sigue, repite, para)
    const control = ControlCommandDetector.detect(rawQuery);
    if (control !== 'none') {
      const turn = this.handleControlCommand(userKey, control, start);
      if (turn) return turn;
    }

    // 2. Extraer si el usuario pidió un proveedor específico en la frase ("con gemini...")
    const detection = ProviderDetector.detect(rawQuery);
    const activeQuery = detection.cleanedQuery;
    const requestedProvider = cmd.explicitProvider && cmd.explicitProvider !== 'auto'
      ? cmd.explicitProvider
      : detection.provider;

    // 3. Resolver decisión de modelo
    const decision = this.router.resolve({
      query: activeQuery,
      explicitProvider: requestedProvider,
      defaultProvider: this.defaultProvider
    });

    const providerInstance = this.registry.get(decision.provider);
    if (!providerInstance || !providerInstance.isConfigured()) {
      return {
        speechText: `El proveedor ${decision.provider} no está disponible en este momento.`,
        hasMore: false,
        provider: decision.provider,
        model: 'none',
        responseMode: 'concise',
        latencyMs: Date.now() - start
      };
    }

    // 4. Modo de respuesta (concise vs narrative)
    const mode = ResponseModeDetector.detect(activeQuery);

    // 5. Historial conversacional previo
    const history = await this.conversationManager.getHistory(userKey);

    // 6. Preparar el System Prompt optimizado para la voz
    const systemPrompt = mode === 'narrative'
      ? 'Eres un asistente de voz interactivo. Tu respuesta será escuchada mediante un dispositivo de voz, no leída. Sé expresivo, estructurado en párrafos claros y narrativo. No uses markdown, no uses listas con viñetas, no uses asteriscos ni tablas ni URLs.'
      : 'Eres un asistente de voz interactivo. Tu respuesta será escuchada mediante un dispositivo de voz. Responde de forma directa, concisa, natural y conversacional en unas 2 a 4 oraciones. No uses markdown, no uses negritas, no uses asteriscos ni tablas ni URLs.';

    // 7. Configuración de deadline / abort signal si se especificó (para respetar los 8s de Alexa)
    let abortController: AbortController | undefined;
    if (cmd.deadlineMs) {
      abortController = new AbortController();
      setTimeout(() => abortController?.abort(), cmd.deadlineMs);
    }

    // 8. Llamar al proveedor de IA
    const aiResponse = await providerInstance.ask({
      messages: [...history, { role: 'user', content: activeQuery }],
      systemPrompt,
      mode,
      signal: abortController?.signal
    });

    // 9. Formatear y sanitizar la respuesta para síntesis vocal
    const cleanedSpeech = VoiceResponseFormatter.formatForSpeech(aiResponse.text);

    // 10. Actualizar historial de conversación del asistente
    await this.conversationManager.appendTurn(userKey, activeQuery, cleanedSpeech);

    // 11. Registrar en el gestor de respuestas largas si excede un tamaño prudente
    const longChunk = this.longResponseManager.registerContent(
      userKey,
      cleanedSpeech,
      aiResponse.provider,
      mode === 'narrative' ? 1800 : 1200
    );

    let speechText = longChunk.currentText;
    if (longChunk.hasMore) {
      speechText += '. ¿Quieres que continúe?';
    }

    return {
      speechText,
      hasMore: longChunk.hasMore,
      provider: aiResponse.provider,
      model: aiResponse.model,
      responseMode: mode,
      latencyMs: Date.now() - start
    };
  }

  private handleControlCommand(
    userKey: string,
    control: ControlCommandType,
    start: number
  ): AssistantTurn | null {
    if (control === 'stop') {
      this.longResponseManager.clear(userKey);
      return {
        speechText: 'Listo.',
        hasMore: false,
        provider: 'system',
        model: 'system',
        responseMode: 'concise',
        latencyMs: Date.now() - start,
        controlAction: 'stop'
      };
    }

    if (control === 'repeat') {
      const current = this.longResponseManager.getCurrentChunk(userKey);
      if (current) {
        return {
          speechText: current + (this.longResponseManager.hasPendingContent(userKey) ? '. ¿Quieres que continúe?' : ''),
          hasMore: this.longResponseManager.hasPendingContent(userKey),
          provider: 'system',
          model: 'system',
          responseMode: 'concise',
          latencyMs: Date.now() - start,
          controlAction: 'repeat'
        };
      }
    }

    if (control === 'previous') {
      const prev = this.longResponseManager.getPreviousChunk(userKey);
      if (prev) {
        return {
          speechText: prev.text + '. ¿Quieres que continúe?',
          hasMore: true,
          provider: 'system',
          model: 'system',
          responseMode: 'concise',
          latencyMs: Date.now() - start,
          controlAction: 'previous'
        };
      }
    }

    if (control === 'continue') {
      const next = this.longResponseManager.getNextChunk(userKey);
      if (next) {
        let text = next.text;
        if (next.hasMore) {
          text += '. ¿Quieres que continúe?';
        }
        return {
          speechText: text,
          hasMore: next.hasMore,
          provider: 'system',
          model: 'system',
          responseMode: 'concise',
          latencyMs: Date.now() - start,
          controlAction: 'continue'
        };
      }
    }

    return null;
  }
}
