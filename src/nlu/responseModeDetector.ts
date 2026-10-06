export type ResponseMode = 'concise' | 'narrative';

const NARRATIVE_KEYWORDS = [
  /cuento/i,
  /historia/i,
  /relato/i,
  /poema/i,
  /f[aá]bula/i,
  /inventa\s+(?:un|una)/i,
  /crea\s+(?:un|una)\s+(?:cuento|historia|relato)/i,
  /expl[ií]came\s+en\s+detalle/i,
  /con\s+detalle/i,
  /versi[oó]n\s+larga/i,
  /extens[ao]/i
];

export class ResponseModeDetector {
  /**
   * Clasifica si la petición del usuario busca una respuesta breve y al punto ('concise')
   * o una narración/explicación extendida ('narrative').
   */
  static detect(query: string): ResponseMode {
    for (const rx of NARRATIVE_KEYWORDS) {
      if (rx.test(query)) {
        return 'narrative';
      }
    }
    return 'concise';
  }
}
