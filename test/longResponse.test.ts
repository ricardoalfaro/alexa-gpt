import { describe, it, expect } from 'vitest';
import { SemanticChunker } from '../src/longform/semanticChunker.js';
import { LongResponseManager } from '../src/longform/longResponseManager.js';

describe('LongResponseManager y SemanticChunker', () => {
  it('divide el texto sin cortar oraciones a la mitad', () => {
    const text = 'Primera oración muy clara. Segunda oración con más detalles importantes. Tercera oración conclusiva.';
    const chunks = SemanticChunker.chunk(text, 50);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(55); // pequeño margen de espacio
      expect(chunk.endsWith('.')).toBe(true);
    }
  });

  it('permite avanzar, repetir y retroceder por fragmentos', () => {
    const manager = new LongResponseManager(30);
    const userKey = 'user_123';
    const text = 'Parte uno completa. Parte dos completa. Parte tres completa.';

    // Registrar con longitud pequeña para forzar múltiples chunks
    const initial = manager.registerContent(userKey, text, 'openai', 25);
    expect(initial.hasMore).toBe(true);
    expect(manager.hasPendingContent(userKey)).toBe(true);

    // Avanzar
    const next = manager.getNextChunk(userKey);
    expect(next).not.toBeNull();
    expect(next?.text).toContain('Parte dos');

    // Repetir fragmento actual
    const current = manager.getCurrentChunk(userKey);
    expect(current).toContain('Parte dos');

    // Retroceder
    const prev = manager.getPreviousChunk(userKey);
    expect(prev).not.toBeNull();
    expect(prev?.text).toContain('Parte uno');
  });
});
