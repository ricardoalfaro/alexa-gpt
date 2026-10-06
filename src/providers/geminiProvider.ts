import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIRequest, AIResponse } from './aiProvider.js';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini' as const;
  private client: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    this.modelName = modelName;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async ask(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Gemini no está configurado. Por favor define GEMINI_API_KEY en el entorno.');
    }

    const start = Date.now();
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: request.systemPrompt,
        generationConfig: {
          maxOutputTokens: request.maxOutputTokens || (request.mode === 'concise' ? 250 : 1200)
        }
      });

      // Conversión de historial al formato de Gemini
      const contents = request.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      if (request.onToken) {
        const result = await model.generateContentStream({ contents });
        let accumulated = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            accumulated += text;
            request.onToken(text);
          }
        }

        return {
          text: accumulated,
          provider: 'gemini',
          model: this.modelName,
          latencyMs: Date.now() - start,
          finishReason: 'stop'
        };
      } else {
        const result = await model.generateContent({ contents });
        const response = await result.response;
        const text = response.text() || '';

        return {
          text,
          provider: 'gemini',
          model: this.modelName,
          latencyMs: Date.now() - start,
          finishReason: 'stop'
        };
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        return {
          text: '',
          provider: 'gemini',
          model: this.modelName,
          latencyMs: Date.now() - start,
          finishReason: 'timeout'
        };
      }
      throw err;
    }
  }
}
