import { ConversationStore, Conversation } from './conversationStore.js';
import { ChatMessage } from '../providers/aiProvider.js';

export class ConversationManager {
  private store: ConversationStore;
  private ttlMinutes: number;

  constructor(store: ConversationStore, ttlMinutes: number = 30) {
    this.store = store;
    this.ttlMinutes = ttlMinutes;
  }

  async getHistory(userKey: string): Promise<ChatMessage[]> {
    const convo = await this.store.get(userKey);
    return convo ? convo.messages : [];
  }

  async appendTurn(userKey: string, userText: string, assistantText: string): Promise<void> {
    let convo = await this.store.get(userKey);
    if (!convo) {
      convo = {
        id: `convo_${Date.now()}`,
        userKey,
        messages: [],
        lastUpdated: Date.now()
      };
    }

    convo.messages.push({ role: 'user', content: userText });
    convo.messages.push({ role: 'assistant', content: assistantText });

    // Mantener un historial prudente para no desbordar tokens ni contexto de voz (últimas 10 intervenciones)
    if (convo.messages.length > 20) {
      convo.messages = convo.messages.slice(-20);
    }
    convo.lastUpdated = Date.now();

    await this.store.save(userKey, convo, this.ttlMinutes);
  }

  async reset(userKey: string): Promise<void> {
    await this.store.delete(userKey);
  }
}
