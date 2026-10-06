export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  messages: ChatMessage[];
  systemPrompt: string;
  mode: 'concise' | 'narrative';
  maxOutputTokens?: number;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface AIResponse {
  text: string;
  provider: 'openai' | 'gemini';
  model: string;
  latencyMs: number;
  finishReason?: 'stop' | 'length' | 'timeout' | 'aborted';
}

export interface AIProvider {
  readonly id: 'openai' | 'gemini';
  isConfigured(): boolean;
  ask(request: AIRequest): Promise<AIResponse>;
}
