import crypto from 'node:crypto';

export interface StructuredLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  sessionHash?: string;
  userHash?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  success?: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export function hashIdentifier(id?: string): string | undefined {
  if (!id) return undefined;
  return crypto.createHash('sha256').update(id).digest('hex').substring(0, 12);
}

export class AppLogger {
  private logPrompts: boolean;

  constructor(logPrompts: boolean = false) {
    this.logPrompts = logPrompts;
  }

  info(event: string, meta: Partial<StructuredLog> = {}) {
    this.log('info', event, meta);
  }

  warn(event: string, meta: Partial<StructuredLog> = {}) {
    this.log('warn', event, meta);
  }

  error(event: string, meta: Partial<StructuredLog> = {}) {
    this.log('error', event, meta);
  }

  private log(level: 'info' | 'warn' | 'error', event: string, meta: Partial<StructuredLog>) {
    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...meta
    };

    // Si no se autoriza loggear prompts, asegurar que no existan queries o texto sensible en details
    if (!this.logPrompts && entry.details) {
      const sanitizedDetails = { ...entry.details };
      delete sanitizedDetails.prompt;
      delete sanitizedDetails.query;
      delete sanitizedDetails.answer;
      delete sanitizedDetails.text;
      entry.details = sanitizedDetails;
    }

    const output = JSON.stringify(entry);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}
