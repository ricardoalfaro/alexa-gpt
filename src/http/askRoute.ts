import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AIOrchestrator } from '../orchestrator/aiOrchestrator.js';
import { ProviderId } from '../config.js';

interface AskRequestBody {
  query: string;
  provider?: ProviderId;
  sessionId?: string;
  userId?: string;
}

export function registerAskRoute(app: FastifyInstance, orchestrator: AIOrchestrator) {
  app.post<{ Body: AskRequestBody }>('/ask', async (request, reply) => {
    const { query, provider = 'auto', sessionId, userId = 'default_user' } = request.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return reply.status(400).send({
        error: 'El campo "query" es requerido y no puede estar vacío.'
      });
    }

    try {
      const turn = await orchestrator.processTurn({
        query,
        userKey: userId,
        sessionId,
        explicitProvider: provider
      });

      return reply.send({
        answer: turn.speechText,
        provider: turn.provider,
        model: turn.model,
        latencyMs: turn.latencyMs,
        responseMode: turn.responseMode,
        hasMore: turn.hasMore
      });
    } catch (err: unknown) {
      const error = err as Error;
      request.log.error(error);
      return reply.status(500).send({
        error: 'Error procesando la solicitud con el modelo de IA.',
        details: error.message
      });
    }
  });
}
