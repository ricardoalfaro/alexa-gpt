import { ChatMessage } from '../providers/aiProvider.js';

export interface Conversation {
  id: string;
  userKey: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

export interface ConversationStore {
  get(key: string): Promise<Conversation | null>;
  save(key: string, conversation: Conversation, ttlMinutes: number): Promise<void>;
  delete(key: string): Promise<void>;
}
