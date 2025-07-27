/**
 * Service Container - Dependency Injection
 * 
 * Implements dependency injection pattern for service layer.
 * Follows SOLID principles with Single Responsibility.
 * Max 200 lines - Zero Monolith Policy
 */

import type { ServiceConfig, AppError } from '../types/app.js';

// =============================================================================
// Service Container Types
// =============================================================================

type ServiceFactory<T> = () => T | Promise<T>;
type ServiceInstance<T> = T;

interface ServiceRegistration<T> {
	readonly factory: ServiceFactory<T>;
	readonly singleton: boolean;
	instance?: ServiceInstance<T>;
}

export interface ServiceDescriptor {
	readonly name: string;
	readonly dependencies: string[];
	readonly singleton: boolean;
}

// =============================================================================
// Service Container Implementation
// =============================================================================

export class ServiceContainer {
	private readonly services = new Map<string, ServiceRegistration<unknown>>();
	private readonly resolving = new Set<string>();

	/**
	 * Register a service with the container
	 */
	register<T>(
		name: string, 
		factory: ServiceFactory<T>, 
		singleton = true
	): void {
		if (this.services.has(name)) {
			throw new Error(`Service '${name}' is already registered`);
		}

		this.services.set(name, {
			factory,
			singleton
		});
	}

	/**
	 * Resolve a service from the container
	 */
	async resolve<T>(name: string): Promise<T> {
		const registration = this.services.get(name);
		if (!registration) {
			throw new Error(`Service '${name}' is not registered`);
		}

		// Check for circular dependencies
		if (this.resolving.has(name)) {
			throw new Error(`Circular dependency detected for service '${name}'`);
		}

		// Return existing singleton instance
		if (registration.singleton && registration.instance) {
			return registration.instance as T;
		}

		this.resolving.add(name);

		try {
			const instance = await registration.factory();
			
			if (registration.singleton) {
				registration.instance = instance;
			}

			return instance as T;
		} finally {
			this.resolving.delete(name);
		}
	}

	/**
	 * Check if a service is registered
	 */
	has(name: string): boolean {
		return this.services.has(name);
	}

	/**
	 * Get all registered service names
	 */
	getServiceNames(): string[] {
		return Array.from(this.services.keys());
	}

	/**
	 * Clear all services (for testing)
	 */
	clear(): void {
		this.services.clear();
		this.resolving.clear();
	}

	/**
	 * Get service descriptors for debugging
	 */
	getDescriptors(): ServiceDescriptor[] {
		return Array.from(this.services.entries()).map(([name, registration]) => ({
			name,
			dependencies: [],
			singleton: registration.singleton
		}));
	}
}

// =============================================================================
// Global Service Container
// =============================================================================

export const serviceContainer = new ServiceContainer();

// =============================================================================
// Service Registration Helpers
// =============================================================================

export function registerService<T>(
	name: string,
	factory: ServiceFactory<T>,
	singleton = true
): void {
	serviceContainer.register(name, factory, singleton);
}

export async function getService<T>(name: string): Promise<T> {
	return serviceContainer.resolve<T>(name);
}

// =============================================================================
// Configuration Service
// =============================================================================

export interface ConfigService {
	get<T>(key: string): T | undefined;
	set<T>(key: string, value: T): void;
	has(key: string): boolean;
}

export class DefaultConfigService implements ConfigService {
	private readonly config = new Map<string, unknown>();

	get<T>(key: string): T | undefined {
		return this.config.get(key) as T | undefined;
	}

	set<T>(key: string, value: T): void {
		this.config.set(key, value);
	}

	has(key: string): boolean {
		return this.config.has(key);
	}
}

// =============================================================================
// Service Registration for Core Services
// =============================================================================

// Register default configuration service
registerService('config', () => new DefaultConfigService(), true);

// Register NostrService
registerService('nostr', async () => {
	const { createNostrService } = await import('./NostrService.js');
	return createNostrService({
		relays: ['ws://umbrel.local:4848'],
		debug: true,
		timeout: 10000
	});
}, true);

// Register AuthService  
registerService('auth', async () => {
	const { createAuthService } = await import('./AuthService.js');
	return createAuthService();
}, true);