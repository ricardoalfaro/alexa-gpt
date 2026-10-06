import { describe, it, expect } from 'vitest';
import { ProviderDetector } from '../src/nlu/providerDetector.js';

describe('ProviderDetector', () => {
  it('detecta Gemini al inicio con prefijo "con gemini"', () => {
    const res = ProviderDetector.detect('Con Gemini explícame qué es Open Finance');
    expect(res.provider).toBe('gemini');
    expect(res.explicitlySpecified).toBe(true);
    expect(res.cleanedQuery.toLowerCase()).toContain('qué es open finance');
  });

  it('detecta Gemini con "pregúntale a gemini"', () => {
    const res = ProviderDetector.detect('Pregúntale a Gemini qué pasó hoy con Bitcoin');
    expect(res.provider).toBe('gemini');
    expect(res.explicitlySpecified).toBe(true);
    expect(res.cleanedQuery.toLowerCase()).toContain('qué pasó hoy con bitcoin');
  });

  it('detecta OpenAI con "con chatgpt"', () => {
    const res = ProviderDetector.detect('Con ChatGPT explícame la teoría de la relatividad');
    expect(res.provider).toBe('openai');
    expect(res.explicitlySpecified).toBe(true);
    expect(res.cleanedQuery.toLowerCase()).toContain('la teoría de la relatividad');
  });

  it('detecta OpenAI con "usa openai para"', () => {
    const res = ProviderDetector.detect('Usa OpenAI para responder esto');
    expect(res.provider).toBe('openai');
    expect(res.explicitlySpecified).toBe(true);
    expect(res.cleanedQuery.toLowerCase()).toContain('responder esto');
  });

  it('retorna "auto" cuando no se especifica proveedor', () => {
    const res = ProviderDetector.detect('¿Cuándo fue la independencia de Chile?');
    expect(res.provider).toBe('auto');
    expect(res.explicitlySpecified).toBe(false);
    expect(res.cleanedQuery).toBe('¿Cuándo fue la independencia de Chile?');
  });
});
