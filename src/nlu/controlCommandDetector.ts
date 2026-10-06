export type ControlCommandType = 
  | 'continue'   // sí, sigue, continúa, dale, adelante
  | 'stop'       // no, para, basta, cancela, detente
  | 'repeat'     // repite, qué dijiste, de nuevo
  | 'previous'   // anterior, vuelve a la parte anterior, atrás
  | 'none';

const CONTROL_PATTERNS: Array<{ type: ControlCommandType; regex: RegExp }> = [
  {
    type: 'continue',
    regex: /^(s[ií]|contin[uú]a|sigue|dale|adelante|prosigue|siguiente|m[aá]s|cuenta\s+m[aá]s|continua\s+por\s+favor|sigue\s+por\s+favor)$/i
  },
  {
    type: 'stop',
    regex: /^(no|para|detente|basta|cancela|detener|alto|hasta\s+aqu[ií]|ya\s+est[aá]|listo)$/i
  },
  {
    type: 'repeat',
    regex: /^(repite|repite\s+eso|repite\s+por\s+favor|otra\s+vez|de\s+nuevo|qu[eé]\s+dijiste|c[oó]mo\s+dijiste)$/i
  },
  {
    type: 'previous',
    regex: /^(anterior|vuelve|atr[aá]s|la\s+parte\s+anterior|vuelve\s+a\s+la\s+parte\s+anterior|retrocede)$/i
  }
];

export class ControlCommandDetector {
  /**
   * Detecta si un texto recibido en un slot abierto es en realidad un comando conversacional
   * de navegación o control de flujo de respuestas largas.
   */
  static detect(input: string): ControlCommandType {
    const sanitized = input
      .trim()
      .toLowerCase()
      .replace(/[¿?¡!.,;]/g, '');

    for (const item of CONTROL_PATTERNS) {
      if (item.regex.test(sanitized)) {
        return item.type;
      }
    }

    return 'none';
  }
}
