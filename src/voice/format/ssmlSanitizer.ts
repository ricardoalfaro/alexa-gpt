/**
 * Utilidades para escapar y construir SSML seguro para síntesis de voz en Alexa.
 */

export class SsmlSanitizer {
  /**
   * Escapa caracteres reservados XML en texto plano generado por LLM.
   */
  static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Envuelve un texto seguro en etiquetas <speak>...</speak>, añadiendo pausas naturales
   * en puntos seguidos si es apropiado para mejorar la cadencia.
   */
  static wrapInSpeak(text: string): string {
    const escaped = this.escapeXml(text);
    // Inserta pausas sutiles de 200ms entre párrafos o oraciones principales si hay saltos de línea
    const cadence = escaped.replace(/\n\n+/g, '<break time="400ms"/> ');
    return `<speak>${cadence}</speak>`;
  }
}
