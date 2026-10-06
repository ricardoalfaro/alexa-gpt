/**
 * Divide textos extensos en fragmentos audibles razonables (aprox 1000 - 1800 caracteres),
 * respetando estrictamente límites de oraciones (puntos, signos de interrogación o exclamación).
 * Nunca corta una oración a la mitad.
 */
export class SemanticChunker {
  static chunk(text: string, maxChunkLength: number = 1500): string[] {
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.length <= maxChunkLength) {
      return [trimmed];
    }

    // Dividir en oraciones utilizando puntuación fuerte
    const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
    const sentences = trimmed.match(sentenceRegex) || [trimmed];

    const chunks: string[] = [];
    let current = '';

    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;

      if ((current + ' ' + sentence).trim().length <= maxChunkLength) {
        current = current ? `${current} ${sentence}` : sentence;
      } else {
        if (current) {
          chunks.push(current);
        }
        // Si una sola oración excede maxChunkLength (caso raro de párrafo sin puntos),
        // dividirla por comas o punto y coma
        if (sentence.length > maxChunkLength) {
          const subParts = sentence.split(/[,;]\s+/);
          let subCurrent = '';
          for (const sub of subParts) {
            if ((subCurrent + ', ' + sub).trim().length <= maxChunkLength) {
              subCurrent = subCurrent ? `${subCurrent}, ${sub}` : sub;
            } else {
              if (subCurrent) chunks.push(subCurrent);
              subCurrent = sub;
            }
          }
          current = subCurrent;
        } else {
          current = sentence;
        }
      }
    }

    if (current) {
      chunks.push(current);
    }

    return chunks;
  }
}
