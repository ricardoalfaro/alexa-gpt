import { ResponseFactory } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { SsmlSanitizer } from '../format/ssmlSanitizer.js';

export class AlexaResponseBuilder {
  /**
   * Genera una respuesta conversacional que mantiene el micrófono abierto
   * y vuelve a elicitar el slot de pregunta abierta para permitir la siguiente consulta sin repetir el wake word.
   */
  static buildElicitedTurn(speechText: string, repromptText: string = '¿Algo más?'): Response {
    const ssml = SsmlSanitizer.wrapInSpeak(speechText);
    const repromptSsml = SsmlSanitizer.wrapInSpeak(repromptText);

    return ResponseFactory.init()
      .speak(ssml)
      .reprompt(repromptSsml)
      .addElicitSlotDirective('query', {
        name: 'AskIntent',
        confirmationStatus: 'NONE',
        slots: {
          query: {
            name: 'query',
            value: '',
            confirmationStatus: 'NONE'
          }
        }
      })
      .getResponse();
  }

  /**
   * Genera una respuesta estándar manteniendo sesión abierta con shouldEndSession: false
   */
  static buildOpenTurn(speechText: string, repromptText: string = '¿Sigues ahí?'): Response {
    const ssml = SsmlSanitizer.wrapInSpeak(speechText);
    const repromptSsml = SsmlSanitizer.wrapInSpeak(repromptText);

    return ResponseFactory.init()
      .speak(ssml)
      .reprompt(repromptSsml)
      .withShouldEndSession(false)
      .getResponse();
  }

  /**
   * Cierra la sesión de Alexa limpiamente cuando el usuario dice "para", "adiós", etc.
   */
  static buildClosingTurn(speechText: string = 'Listo.'): Response {
    const ssml = SsmlSanitizer.wrapInSpeak(speechText);
    return ResponseFactory.init()
      .speak(ssml)
      .withShouldEndSession(true)
      .getResponse();
  }
}
