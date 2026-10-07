import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Conversation, ConversationStore } from './conversationStore.js';

export class SupabaseConversationStore implements ConversationStore {
  private client: SupabaseClient;
  private tableName: string;

  constructor(supabaseUrl: string, supabaseKey: string, tableName: string = 'conversations') {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.tableName = tableName;
  }

  async get(key: string): Promise<Conversation | null> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_key', key)
        .gt('expires_at', now)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id || `convo_${key}`,
        userKey: data.user_key,
        messages: Array.isArray(data.messages) ? data.messages : [],
        lastUpdated: new Date(data.updated_at || Date.now()).getTime()
      };
    } catch {
      return null;
    }
  }

  async save(key: string, conversation: Conversation, ttlMinutes: number): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

      await this.client.from(this.tableName).upsert(
        {
          user_key: key,
          messages: conversation.messages,
          updated_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        },
        { onConflict: 'user_key' }
      );
    } catch (err) {
      console.error('Error al guardar conversación en Supabase:', err);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.from(this.tableName).delete().eq('user_key', key);
    } catch (err) {
      console.error('Error al eliminar conversación en Supabase:', err);
    }
  }
}
