import { describe, it, expect } from 'vitest';
import { VoiceResponseFormatter } from '../src/voice/format/voiceResponseFormatter.js';
import { SsmlSanitizer } from '../src/voice/format/ssmlSanitizer.js';

describe('VoiceResponseFormatter y SsmlSanitizer', () => {
  it('remueve sintaxis Markdown de negrita, cursiva y encabezados', () => {
    const raw = '# Título\nEsta es una **prueba importante** de texto con *énfasis*.';
    const formatted = VoiceResponseFormatter.formatForSpeech(raw);
    expect(formatted).not.toContain('#');
    expect(formatted).not.toContain('**');
    expect(formatted).not.toContain('*');
    expect(formatted).toContain('Esta es una prueba importante de texto con énfasis.');
  });

  it('remueve URLs y enlaces Markdown', () => {
    const raw = 'Visita [nuestro sitio](https://openai.com) o entra directamente a https://google.com para más datos.';
    const formatted = VoiceResponseFormatter.formatForSpeech(raw);
    expect(formatted).not.toContain('https://');
    expect(formatted).toContain('Visita nuestro sitio o entra directamente a para más datos.');
  });

  it('remueve bloques de código', () => {
    const raw = 'Aquí tienes el código:\n```python\nprint("hola")\n```\nFin del código.';
    const formatted = VoiceResponseFormatter.formatForSpeech(raw);
    expect(formatted).not.toContain('python');
    expect(formatted).not.toContain('print');
    expect(formatted).toContain('Aquí tienes el código:\nFin del código.');
  });

  it('escapa caracteres especiales en SSML y envuelve en <speak>', () => {
    const speech = 'Tom & Jerry dijeron <hola> y ganaron "oro"';
    const ssml = SsmlSanitizer.wrapInSpeak(speech);
    expect(ssml).toBe('<speak>Tom &amp; Jerry dijeron &lt;hola&gt; y ganaron &quot;oro&quot;</speak>');
  });
});
