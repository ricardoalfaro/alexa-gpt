/**
 * Limpia y adapta texto generado por LLMs para que sea natural al ser escuchado
 * a través de un asistente de voz. Remueve Markdown, URLs, caracteres especiales y bloques de código.
 */

export class VoiceResponseFormatter {
  static formatForSpeech(text: string): string {
    if (!text) return '';

    let cleaned = text;

    // 1. Eliminar bloques de código ```...``` y código en línea `...`
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    // 2. Eliminar imágenes markdown ![alt](url) y links [texto](url) -> texto
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

    // 3. Eliminar URLs directas (https://...)
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');

    // 4. Eliminar encabezados Markdown (# Encabezado)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

    // 5. Eliminar negritas, cursivas, tachados (**texto**, *texto*, ~~texto~~)
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2');
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
    cleaned = cleaned.replace(/~~(.*?)~~/g, '$1');

    // 6. Eliminar viñetas y listas numéricas (* item, - item, 1. item) convirtiéndolas en texto corrido
    cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, '');
    cleaned = cleaned.replace(/^\d+\.\s+/gm, '');

    // 7. Eliminar tablas markdown (| col | col |)
    cleaned = cleaned.replace(/\|/g, ' ');
    cleaned = cleaned.replace(/[-:]{3,}/g, '');

    // 8. Normalizar espacios en blanco y saltos de línea repetidos
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n/g, '\n');
    cleaned = cleaned.trim();

    return cleaned;
  }
}
