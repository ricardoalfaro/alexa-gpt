export type ProviderId = 'openai' | 'gemini' | 'auto';

export interface Config {
  port: number;
  openAiApiKey: string;
  geminiApiKey: string;
  defaultAiProvider: 'openai' | 'gemini';
  openAiModel: string;
  geminiModel: string;
  conversationTtlMinutes: number;
  logPrompts: boolean;
  verifyAlexaSignature: boolean;
  alexaSkillId?: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER === 'gemini' ? 'gemini' : 'openai'),
    openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    conversationTtlMinutes: parseInt(process.env.CONVERSATION_TTL_MINUTES || '30', 10),
    logPrompts: process.env.LOG_PROMPTS === 'true',
    verifyAlexaSignature: process.env.VERIFY_ALEXA_SIGNATURE === 'true',
    alexaSkillId: process.env.ALEXA_SKILL_ID || undefined
  };
}
