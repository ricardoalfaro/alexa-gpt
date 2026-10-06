import { SemanticChunker } from './semanticChunker.js';

export interface LongResponseState {
  contentId: string;
  chunks: string[];
  currentChunk: number;
  totalChunks: number;
  provider: string;
  expiresAt: number;
}

export class LongResponseManager {
  private cache = new Map<string, LongResponseState>();
  private ttlMinutes: number;

  constructor(ttlMinutes: number = 30) {
    this.ttlMinutes = ttlMinutes;
  }

  /**
   * Registra un contenido largo recién generado. Si se divide en varios fragmentos,
   * retorna el primer fragmento y guarda el estado para continuar después.
   */
  registerContent(
    userKey: string,
    fullText: string,
    provider: string,
    maxChunkLength: number = 1500
  ): { currentText: string; hasMore: boolean } {
    const chunks = SemanticChunker.chunk(fullText, maxChunkLength);
    if (chunks.length <= 1) {
      this.cache.delete(userKey);
      return { currentText: fullText, hasMore: false };
    }

    const state: LongResponseState = {
      contentId: `long_${Date.now()}`,
      chunks,
      currentChunk: 0,
      totalChunks: chunks.length,
      provider,
      expiresAt: Date.now() + this.ttlMinutes * 60 * 1000
    };

    this.cache.set(userKey, state);
    return {
      currentText: chunks[0],
      hasMore: true
    };
  }

  hasPendingContent(userKey: string): boolean {
    const state = this.getState(userKey);
    return Boolean(state && state.currentChunk < state.totalChunks - 1);
  }

  getNextChunk(userKey: string): { text: string; hasMore: boolean } | null {
    const state = this.getState(userKey);
    if (!state || state.currentChunk >= state.totalChunks - 1) {
      return null;
    }

    state.currentChunk++;
    const hasMore = state.currentChunk < state.totalChunks - 1;
    if (!hasMore) {
      // Ya entregamos el último chunk
      this.cache.delete(userKey);
    }

    return {
      text: state.chunks[state.currentChunk],
      hasMore
    };
  }

  getPreviousChunk(userKey: string): { text: string; hasMore: boolean } | null {
    const state = this.getState(userKey);
    if (!state || state.currentChunk <= 0) {
      return null;
    }

    state.currentChunk--;
    return {
      text: state.chunks[state.currentChunk],
      hasMore: true
    };
  }

  getCurrentChunk(userKey: string): string | null {
    const state = this.getState(userKey);
    if (!state) return null;
    return state.chunks[state.currentChunk] || null;
  }

  clear(userKey: string): void {
    this.cache.delete(userKey);
  }

  private getState(userKey: string): LongResponseState | null {
    const state = this.cache.get(userKey);
    if (!state) return null;

    if (Date.now() > state.expiresAt) {
      this.cache.delete(userKey);
      return null;
    }

    return state;
  }
}
