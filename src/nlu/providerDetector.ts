import { ProviderId } from '../config.js';

export interface ProviderDetectionResult {
  provider: ProviderId;
  cleanedQuery: string;
  explicitlySpecified: boolean;
}

const PATTERNS: Array<{
  provider: 'openai' | 'gemini';
  regexes: RegExp[];
}> = [
  {
    provider: 'gemini',
    regexes: [
      /^(?:con|usando|utilizando|usa|preg[uú]ntale\s+a|p[ií]dele\s+a)\s+gemini(?:\s+(?:que|para|de|explicame|expl[ií]came|sobre))?\s+(.*)$/i,
      /^(?:con|usando|utilizando)\s+google\s+gemini\s+(.*)$/i,
      /^(.*)\s+(?:con|usando|preg[uú]ntale\s+a)\s+gemini$/i
    ]
  },
  {
    provider: 'openai',
    regexes: [
      /^(?:con|usando|utilizando|usa|preg[uú]ntale\s+a|p[ií]dele\s+a)\s+(?:chat\s*gpt|chatgpt|openai)(?:\s+(?:que|para|de|explicame|expl[ií]came|sobre))?\s+(.*)$/i,
      /^(.*)\s+(?:con|usando|preg[uú]ntale\s+a)\s+(?:chat\s*gpt|chatgpt|openai)$/i
    ]
  }
];

export class ProviderDetector {
  /**
   * Analiza la consulta del usuario para detectar si solicitó un proveedor en específico.
   * Si lo solicitó, extrae el proveedor y limpia la consulta para que el LLM reciba solo la pregunta real.
   */
  static detect(query: string): ProviderDetectionResult {
    const trimmed = query.trim();
    if (!trimmed) {
      return { provider: 'auto', cleanedQuery: '', explicitlySpecified: false };
    }

    for (const entry of PATTERNS) {
      for (const rx of entry.regexes) {
        const match = trimmed.match(rx);
        if (match) {
          const candidateQuery = (match[1] || '').trim();
          // Asegurar que si el match dejó la consulta limpia, usemos esa
          const cleaned = candidateQuery.length > 0 ? candidateQuery : trimmed;
          return {
            provider: entry.provider,
            cleanedQuery: cleaned,
            explicitlySpecified: true
          };
        }
      }
    }

    return {
      provider: 'auto',
      cleanedQuery: trimmed,
      explicitlySpecified: false
    };
  }
}
