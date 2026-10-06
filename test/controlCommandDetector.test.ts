import { describe, it, expect } from 'vitest';
import { ControlCommandDetector } from '../src/nlu/controlCommandDetector.js';

describe('ControlCommandDetector', () => {
  it('detecta comandos de continuación (sí, continúa, sigue)', () => {
    expect(ControlCommandDetector.detect('sí')).toBe('continue');
    expect(ControlCommandDetector.detect('si')).toBe('continue');
    expect(ControlCommandDetector.detect('continúa')).toBe('continue');
    expect(ControlCommandDetector.detect('sigue')).toBe('continue');
    expect(ControlCommandDetector.detect('dale')).toBe('continue');
    expect(ControlCommandDetector.detect('adelante')).toBe('continue');
  });

  it('detecta comandos de detención (no, para, basta)', () => {
    expect(ControlCommandDetector.detect('para')).toBe('stop');
    expect(ControlCommandDetector.detect('detente')).toBe('stop');
    expect(ControlCommandDetector.detect('basta')).toBe('stop');
    expect(ControlCommandDetector.detect('no')).toBe('stop');
  });

  it('detecta comandos de repetición', () => {
    expect(ControlCommandDetector.detect('repite')).toBe('repeat');
    expect(ControlCommandDetector.detect('repite por favor')).toBe('repeat');
    expect(ControlCommandDetector.detect('de nuevo')).toBe('repeat');
  });

  it('detecta comandos de retroceso', () => {
    expect(ControlCommandDetector.detect('anterior')).toBe('previous');
    expect(ControlCommandDetector.detect('vuelve a la parte anterior')).toBe('previous');
  });

  it('retorna "none" para preguntas regulares', () => {
    expect(ControlCommandDetector.detect('¿Quién era el presidente en esa época?')).toBe('none');
    expect(ControlCommandDetector.detect('Explícame más sobre la fotosíntesis')).toBe('none');
  });
});
