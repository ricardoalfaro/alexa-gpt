import { ProviderId } from '../config.js';
import { ProviderRegistry } from '../providers/providerRegistry.js';

export interface RoutingDecision {
  provider: 'openai' | 'gemini';
  reason: 'explicit_request' | 'default_fallback' | 'intelligent_route';
}

export interface RoutingContext {
  query: string;
  explicitProvider?: ProviderId;
  defaultProvider: 'openai' | 'gemini';
}

export interface RoutingStrategy {
  route(ctx: RoutingContext, registry: ProviderRegistry): RoutingDecision | null;
}

/**
 * Estrategia 1: Respetar selección explícita del usuario
 */
export class ExplicitProviderStrategy implements RoutingStrategy {
  route(ctx: RoutingContext, registry: ProviderRegistry): RoutingDecision | null {
    if (ctx.explicitProvider && ctx.explicitProvider !== 'auto') {
      const target = ctx.explicitProvider;
      if (registry.isAvailable(target)) {
        return {
          provider: target,
          reason: 'explicit_request'
        };
      }
    }
    return null;
  }
}

/**
 * Estrategia 2: Fallback al proveedor por defecto configurado
 */
export class DefaultProviderStrategy implements RoutingStrategy {
  route(ctx: RoutingContext, registry: ProviderRegistry): RoutingDecision | null {
    const preferred = ctx.defaultProvider;
    if (registry.isAvailable(preferred)) {
      return {
        provider: preferred,
        reason: 'default_fallback'
      };
    }

    // Si el preferido no está disponible, buscar el primero que sí lo esté
    const fallback = registry.getAll().find((p) => p.isConfigured());
    if (fallback) {
      return {
        provider: fallback.id,
        reason: 'default_fallback'
      };
    }

    return null;
  }
}

/**
 * ModelRouter desacoplado y extensible mediante cadena de estrategias
 */
export class ModelRouter {
  private strategies: RoutingStrategy[] = [];
  private registry: ProviderRegistry;

  constructor(registry: ProviderRegistry) {
    this.registry = registry;
    // Cadena de resolución
    this.strategies = [
      new ExplicitProviderStrategy(),
      new DefaultProviderStrategy()
    ];
  }

  addStrategy(strategy: RoutingStrategy): void {
    // Permite inyectar estrategias inteligentes a futuro antes del fallback por defecto
    this.strategies.unshift(strategy);
  }

  resolve(ctx: RoutingContext): RoutingDecision {
    for (const strategy of this.strategies) {
      const decision = strategy.route(ctx, this.registry);
      if (decision) {
        return decision;
      }
    }

    throw new Error('No hay ningún proveedor de IA configurado con API Key válida.');
  }
}
