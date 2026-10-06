import OpenAI from 'openai';
import { AIProvider, AIRequest, AIResponse } from './aiProvider.js';

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai' as const;
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.model = model;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async ask(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI no está configurado. Por favor define OPENAI_API_KEY en el entorno.');
    }

    const start = Date.now();
    const systemMessage = {
      role: 'system' as const,
      content: request.systemPrompt
    };

    const messages = [
      systemMessage,
      ...request.messages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];

    try {
      if (request.onToken) {
        // Modo Streaming con recolección de tokens
        const stream = await this.client.chat.completions.create(
          {
            model: this.model,
            messages,
            stream: true,
            max_tokens: request.maxOutputTokens || (request.mode === 'concise' ? 250 : 1200)
          },
          { signal: request.signal }
        );

        let accumulated = '';
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            accumulated += delta;
            request.onToken(delta);
          }
        }

        return {
          text: accumulated,
          provider: 'openai',
          model: this.model,
          latencyMs: Date.now() - start,
          finishReason: 'stop'
        };
      } else {
        // Modo Estándar
        const completion = await this.client.chat.completions.create(
          {
            model: this.model,
            messages,
            max_tokens: request.maxOutputTokens || (request.mode === 'concise' ? 250 : 1200)
          },
          { signal: request.signal }
        );

        const text = completion.choices[0]?.message?.content || '';
        return {
          text,
          provider: 'openai',
          model: this.model,
          latencyMs: Date.now() - start,
          finishReason: 'stop'
        };
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        return {
          text: '',
          provider: 'openai',
          model: this.model,
          latencyMs: Date.now() - start,
          finishReason: 'timeout'
        };
      }
      throw err;
    }
  }
}
