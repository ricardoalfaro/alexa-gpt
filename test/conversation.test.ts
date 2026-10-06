import { describe, it, expect } from 'vitest';
import { ConversationManager } from '../src/conversation/conversationManager.js';
import { InMemoryConversationStore } from '../src/conversation/inMemoryStore.js';

describe('ConversationManager', () => {
  it('almacena y recupera historial de diálogo por userKey', async () => {
    const store = new InMemoryConversationStore();
    const manager = new ConversationManager(store, 30);
    const userKey = 'user_abc';

    await manager.appendTurn(userKey, '¿Cuándo fue la independencia de Chile?', 'El 12 de febrero de 1818.');

    const history = await manager.getHistory(userKey);
    expect(history.length).toBe(2);
    expect(history[0]).toEqual({ role: 'user', content: '¿Cuándo fue la independencia de Chile?' });
    expect(history[1]).toEqual({ role: 'assistant', content: 'El 12 de febrero de 1818.' });

    // Segunda interacción
    await manager.appendTurn(userKey, '¿Y quién gobernaba?', 'Bernardo O\'Higgins.');
    const updatedHistory = await manager.getHistory(userKey);
    expect(updatedHistory.length).toBe(4);
  });

  it('permite reiniciar la conversación', async () => {
    const store = new InMemoryConversationStore();
    const manager = new ConversationManager(store, 30);
    const userKey = 'user_reset';

    await manager.appendTurn(userKey, 'Hola', 'Hola, ¿en qué te ayudo?');
    await manager.reset(userKey);

    const history = await manager.getHistory(userKey);
    expect(history.length).toBe(0);
  });
});
