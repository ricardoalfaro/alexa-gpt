import { HandlerInput, RequestHandler, SkillBuilders, ResponseFactory } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { FastifyInstance } from 'fastify';
import { AIOrchestrator } from '../../orchestrator/aiOrchestrator.js';
import { AlexaResponseBuilder } from './responseBuilder.js';
import { hashIdentifier } from '../../logger.js';

export function createAlexaSkill(orchestrator: AIOrchestrator) {
  const LaunchRequestHandler: RequestHandler = {
    canHandle(input: HandlerInput): boolean {
      return input.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(input: HandlerInput): Response {
      // "Alexa, abre sabio digital" -> "Dime." con micrófono abierto
      return AlexaResponseBuilder.buildElicitedTurn('Dime.', '¿Qué quieres saber?');
    }
  };

  const AskIntentHandler: RequestHandler = {
    canHandle(input: HandlerInput): boolean {
      if (input.requestEnvelope.request.type !== 'IntentRequest') return false;
      const intentName = input.requestEnvelope.request.intent.name;
      return (
        intentName === 'AskIntent' ||
        intentName === 'AskGeminiIntent' ||
        intentName === 'AskOpenAIIntent' ||
        intentName.startsWith('Ask')
      );
    },
    async handle(input: HandlerInput): Promise<Response> {
      const request = input.requestEnvelope.request;
      if (request.type !== 'IntentRequest') return AlexaResponseBuilder.buildClosingTurn();

      const userKey =
        input.requestEnvelope.context?.System?.user?.userId || 'unknown_alexa_user';
      const sessionId = input.requestEnvelope.session?.sessionId;

      const intent = request.intent;
      let queryValue = intent.slots?.query?.value || '';

      // Reconstruir prefijos interrogativos si vino por intents auxiliares (one-shot)
      if (intent.name === 'AskQueIntent') queryValue = `qué ${queryValue}`;
      if (intent.name === 'AskCuandoIntent') queryValue = `cuándo ${queryValue}`;
      if (intent.name === 'AskQuienIntent') queryValue = `quién ${queryValue}`;
      if (intent.name === 'AskComoIntent') queryValue = `cómo ${queryValue}`;
      if (intent.name === 'AskDondeIntent') queryValue = `dónde ${queryValue}`;
      if (intent.name === 'AskPorQueIntent') queryValue = `por qué ${queryValue}`;
      if (intent.name === 'AskCualIntent') queryValue = `cuál ${queryValue}`;
      if (intent.name === 'AskCuantoIntent') queryValue = `cuánto ${queryValue}`;

      if (!queryValue.trim()) {
        return AlexaResponseBuilder.buildElicitedTurn(
          'No alcancé a escucharte bien, ¿me lo repites?',
          '¿Qué quieres preguntarme?'
        );
      }

      // Proveedor forzado si invocó un intent específico de modelo
      let explicitProvider: 'openai' | 'gemini' | 'auto' = 'auto';
      if (intent.name === 'AskGeminiIntent') explicitProvider = 'gemini';
      if (intent.name === 'AskOpenAIIntent') explicitProvider = 'openai';

      try {
        const turn = await orchestrator.processTurn({
          query: queryValue,
          userKey,
          sessionId,
          explicitProvider,
          deadlineMs: 6500 // Deadline de seguridad frente a los 8 segundos de Alexa
        });

        if (turn.controlAction === 'stop') {
          return AlexaResponseBuilder.buildClosingTurn('Listo.');
        }

        return AlexaResponseBuilder.buildElicitedTurn(turn.speechText, '¿Algo más?');
      } catch (err: unknown) {
        return AlexaResponseBuilder.buildElicitedTurn(
          'Tuve un pequeño problema conectando con el modelo de inteligencia artificial. ¿Quieres intentar preguntarme de nuevo?',
          '¿Me repites tu pregunta?'
        );
      }
    }
  };

  const ControlIntentsHandler: RequestHandler = {
    canHandle(input: HandlerInput): boolean {
      if (input.requestEnvelope.request.type !== 'IntentRequest') return false;
      const name = input.requestEnvelope.request.intent.name;
      return (
        name === 'AMAZON.YesIntent' ||
        name === 'ContinueIntent' ||
        name === 'AMAZON.NextIntent' ||
        name === 'AMAZON.ResumeIntent' ||
        name === 'AMAZON.RepeatIntent' ||
        name === 'AMAZON.PreviousIntent' ||
        name === 'AMAZON.NoIntent'
      );
    },
    async handle(input: HandlerInput): Promise<Response> {
      const request = input.requestEnvelope.request;
      if (request.type !== 'IntentRequest') return AlexaResponseBuilder.buildClosingTurn();

      const userKey =
        input.requestEnvelope.context?.System?.user?.userId || 'unknown_alexa_user';
      const name = request.intent.name;

      let simulatedCommand = 'continúa';
      if (name === 'AMAZON.RepeatIntent') simulatedCommand = 'repite';
      if (name === 'AMAZON.PreviousIntent') simulatedCommand = 'anterior';
      if (name === 'AMAZON.NoIntent') {
        return AlexaResponseBuilder.buildElicitedTurn('Entendido. ¿Tienes alguna otra pregunta?');
      }

      const turn = await orchestrator.processTurn({
        query: simulatedCommand,
        userKey
      });

      return AlexaResponseBuilder.buildElicitedTurn(turn.speechText, '¿Quieres continuar?');
    }
  };

  const StopAndCancelHandler: RequestHandler = {
    canHandle(input: HandlerInput): boolean {
      if (input.requestEnvelope.request.type !== 'IntentRequest') return false;
      const name = input.requestEnvelope.request.intent.name;
      return name === 'AMAZON.StopIntent' || name === 'AMAZON.CancelIntent';
    },
    handle(input: HandlerInput): Response {
      return AlexaResponseBuilder.buildClosingTurn('Listo.');
    }
  };

  const SessionEndedRequestHandler: RequestHandler = {
    canHandle(input: HandlerInput): boolean {
      return input.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(input: HandlerInput): Response {
      return ResponseFactory.init().getResponse();
    }
  };

  const FallbackIntentHandler: RequestHandler = {
    canHandle(input: HandlerInput): boolean {
      return (
        input.requestEnvelope.request.type === 'IntentRequest' &&
        input.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent'
      );
    },
    handle(input: HandlerInput): Response {
      return AlexaResponseBuilder.buildElicitedTurn(
        'Disculpa, no logré entender la consulta. ¿Me la repites?',
        '¿Qué te gustaría saber?'
      );
    }
  };

  return SkillBuilders.custom()
    .addRequestHandlers(
      LaunchRequestHandler,
      ControlIntentsHandler,
      StopAndCancelHandler,
      AskIntentHandler,
      FallbackIntentHandler,
      SessionEndedRequestHandler
    )
    .create();
}

export function registerAlexaRoute(app: FastifyInstance, orchestrator: AIOrchestrator) {
  const skill = createAlexaSkill(orchestrator);

  app.post('/alexa', async (request, reply) => {
    try {
      const responseEnvelope = await skill.invoke(request.body as any);
      return reply.send(responseEnvelope);
    } catch (err: unknown) {
      const error = err as Error;
      request.log.error(error);
      return reply.status(500).send({ error: error.message });
    }
  });
}
