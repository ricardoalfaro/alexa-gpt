import { AIProvider } from './aiProvider.js';

export class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: 'openai' | 'gemini'): AIProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  isAvailable(id: 'openai' | 'gemini'): boolean {
    const p = this.providers.get(id);
    return Boolean(p && p.isConfigured());
  }
}
