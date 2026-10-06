import { Conversation, ConversationStore } from './conversationStore.js';

interface CacheEntry {
  conversation: Conversation;
  expiresAt: number;
}

export class InMemoryConversationStore implements ConversationStore {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<Conversation | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.conversation;
  }

  async save(key: string, conversation: Conversation, ttlMinutes: number): Promise<void> {
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    this.store.set(key, { conversation, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
