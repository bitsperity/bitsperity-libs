<!--
  Relay Inspector Component
  
  Live monitoring and inspection of ws://umbrel.local:4848
  Real-time connection stats, event flow, and relay health
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getService } from '../../services/ServiceContainer.js';
	import { createContextLogger } from '../../utils/Logger.js';
	import Button from '../ui/Button.svelte';
	import KeyDisplay from '../ui/KeyDisplay.svelte';
	import type { NostrService } from '../../services/NostrService.js';

	// =============================================================================
	// Component State
	// =============================================================================

	let relayUrl = 'ws://umbrel.local:4848';
	let isConnected = $state(false);
	let connectionStats = $state({
		total: 0,
		connected: 0,
		connecting: 0,
		disconnected: 0,
		error: 0
	});
	let recentEvents = $state<Array<{
		kind: number;
		content: string;
		pubkey: string;
		created_at: number;
		id: string;
	}>>([]);
	let relayInfo = $state<any>(null);
	let isMonitoring = $state(false);
	let eventCount = $state(0);
	let monitoringInterval: ReturnType<typeof setInterval> | null = null;

	const logger = createContextLogger('RelayInspector');

	// =============================================================================
	// Lifecycle
	// =============================================================================

	onMount(async () => {
		await checkRelayStatus();
		startMonitoring();
	});

	onDestroy(() => {
		stopMonitoring();
	});

	// =============================================================================
	// Relay Monitoring Logic
	// =============================================================================

	async function checkRelayStatus(): Promise<void> {
		try {
			const nostrService = await getService<NostrService>('nostr');
			const status = await nostrService.getConnectionStatus();
			
			isConnected = status.isConnected;
			connectionStats = status.stats || connectionStats;
			
			logger.info('Relay status checked', { isConnected, stats: connectionStats });
		} catch (error) {
			logger.error('Failed to check relay status', { error });
			isConnected = false;
		}
	}

	async function startMonitoring(): Promise<void> {
		if (isMonitoring) return;
		
		isMonitoring = true;
		logger.info('Starting relay monitoring...');

		// Update stats every 2 seconds
		monitoringInterval = setInterval(async () => {
			await checkRelayStatus();
			await fetchRecentEvents();
		}, 2000);

		await fetchRecentEvents();
	}

	function stopMonitoring(): void {
		if (monitoringInterval) {
			clearInterval(monitoringInterval);
			monitoringInterval = null;
		}
		isMonitoring = false;
		logger.info('Stopped relay monitoring');
	}

	let currentSubscription: any = null;

	async function fetchRecentEvents(): Promise<void> {
		try {
			const nostrService = await getService<NostrService>('nostr');
			
			// Close previous subscription to avoid "Maximum concurrent subscription count"
			if (currentSubscription) {
				try {
					await currentSubscription.close();
				} catch (e) {
					// Ignore close errors
				}
			}

			// Query for recent text notes (kind 1) - the most common type
			const events = await nostrService.query()
				.kinds([1])
				.limit(10)
				.execute();

			if (events && events.length > 0) {
				recentEvents = events.map(event => ({
					kind: event.kind,
					content: event.content.substring(0, 100),
					pubkey: event.pubkey, // Keep full pubkey for KeyDisplay
					created_at: event.created_at,
					id: event.id.substring(0, 8) + '...'
				}));

				eventCount = events.length;
			} else {
				// No events found, set empty state
				recentEvents = [];
				eventCount = 0;
			}
		} catch (error) {
			logger.error('Failed to fetch recent events', { error });
			recentEvents = [];
			eventCount = 0;
		}
	}

	async function reconnectRelay(): Promise<void> {
		try {
			const nostrService = await getService<NostrService>('nostr');
			await nostrService.disconnect();
			await nostrService.connect();
			await checkRelayStatus();
			logger.info('Relay reconnected');
		} catch (error) {
			logger.error('Failed to reconnect relay', { error });
		}
	}

	function clearEventLog(): void {
		recentEvents = [];
		eventCount = 0;
	}

	// =============================================================================
	// Helper Functions
	// =============================================================================

	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleTimeString();
	}

	function getEventKindName(kind: number): string {
		const kindMap: Record<number, string> = {
			0: 'Profile',
			1: 'Text Note',
			3: 'Contacts',
			4: 'DM',
			5: 'Delete',
			6: 'Repost',
			7: 'Reaction',
			1984: 'Report',
			9734: 'Zap Request',
			9735: 'Zap'
		};
		return kindMap[kind] || `Kind ${kind}`;
	}

	function getConnectionStatusColor(): string {
		if (isConnected) return 'rgb(72, 187, 120)'; // green
		return 'rgb(229, 62, 62)'; // red
	}
</script>

<!--
  Template
  
  Live relay monitoring interface with real-time stats
-->
<div class="relay-inspector">
	<div class="inspector-header">
		<h3>🔍 Relay Inspector</h3>
		<p>Live monitoring of <code>{relayUrl}</code></p>
	</div>

	<!-- Connection Status -->
	<div class="status-panel">
		<div class="status-header">
			<h4>🌐 Connection Status</h4>
			<div class="status-controls">
				<Button variant="outline" size="sm" onclick={reconnectRelay}>
					🔄 Reconnect
				</Button>
				<Button 
					variant={isMonitoring ? 'primary' : 'outline'} 
					size="sm" 
					onclick={isMonitoring ? stopMonitoring : startMonitoring}
				>
					{isMonitoring ? '⏸️ Stop' : '▶️ Start'} Monitor
				</Button>
			</div>
		</div>

		<div class="connection-stats">
			<div class="stat-item">
				<span class="stat-label">Status:</span>
				<span class="stat-value" style="color: {getConnectionStatusColor()}">
					{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
				</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">Total Relays:</span>
				<span class="stat-value">{connectionStats.total}</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">Connected:</span>
				<span class="stat-value">{connectionStats.connected}</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">Connecting:</span>
				<span class="stat-value">{connectionStats.connecting}</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">Recent Events:</span>
				<span class="stat-value">{eventCount}</span>
			</div>
		</div>
	</div>

	<!-- Recent Events -->
	<div class="events-panel">
		<div class="events-header">
			<h4>📊 Recent Events</h4>
			<Button variant="ghost" size="sm" onclick={clearEventLog}>
				🗑️ Clear
			</Button>
		</div>

		{#if recentEvents.length === 0}
			<div class="no-events">
				{#if isMonitoring}
					<p>🔍 Monitoring for events...</p>
				{:else}
					<p>📡 Start monitoring to see live events</p>
				{/if}
			</div>
		{:else}
			<div class="events-list">
				{#each recentEvents as event}
					<div class="event-item">
						<div class="event-header">
							<span class="event-kind" title={getEventKindName(event.kind)}>
								{getEventKindName(event.kind)}
							</span>
							<span class="event-time">
								{formatTimestamp(event.created_at)}
							</span>
						</div>
						<div class="event-content">
							{event.content || '(empty content)'}
						</div>
						<div class="event-meta">
							<span class="event-id">ID: {event.id}</span>
							<span class="event-pubkey">By: <KeyDisplay hexKey={event.pubkey} variant="compact" copyable={true} /></span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Developer Info -->
	<div class="dev-info">
		<h4>🔧 Query Examples</h4>
		<div class="code-examples">
			<div class="code-example">
				<h5>Recent Text Notes:</h5>
				<pre><code>const events = await nostr.query()
  .kind(1)
  .limit(20)
  .since('1 hour ago')
  .fetch();</code></pre>
			</div>
			<div class="code-example">
				<h5>Connection Status:</h5>
				<pre><code>const status = await nostr.getConnectionStatus();
console.log(status.isConnected, status.stats);</code></pre>
			</div>
		</div>
	</div>
</div>

<style>
	.relay-inspector {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 1px solid var(--color-border);
	}

	.inspector-header {
		margin-bottom: var(--spacing-lg);
	}

	.inspector-header h3 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text);
		font-size: var(--text-lg);
	}

	.inspector-header p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.inspector-header code {
		background: var(--color-background);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 0.85em;
	}

	.status-panel {
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-background);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-light);
	}

	.status-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.status-header h4 {
		margin: 0;
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.status-controls {
		display: flex;
		gap: var(--spacing-sm);
	}

	.connection-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--spacing-md);
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-sm);
		background: var(--color-surface);
		border-radius: var(--radius-sm);
	}

	.stat-label {
		font-weight: 500;
		color: var(--color-text);
		font-size: var(--text-sm);
	}

	.stat-value {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.events-panel {
		margin-bottom: var(--spacing-lg);
	}

	.events-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.events-header h4 {
		margin: 0;
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.no-events {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--color-text-muted);
		font-style: italic;
	}

	.events-list {
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.event-item {
		background: var(--color-background);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		font-size: var(--text-sm);
	}

	.event-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.event-kind {
		background: var(--color-primary);
		color: white;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: 500;
	}

	.event-time {
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}

	.event-content {
		color: var(--color-text);
		line-height: var(--leading-tight);
		margin-bottom: var(--spacing-xs);
		word-break: break-word;
	}

	.event-meta {
		display: flex;
		justify-content: space-between;
		color: var(--color-text-light);
		font-size: var(--text-xs);
		font-family: var(--font-mono);
	}

	.dev-info {
		border-top: 1px solid var(--color-border-light);
		padding-top: var(--spacing-md);
	}

	.dev-info h4 {
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text);
		font-size: var(--text-base);
	}

	.code-examples {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.code-example {
		background: var(--color-background);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.code-example h5 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.code-example pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		overflow-x: auto;
	}

	@media (max-width: 768px) {
		.status-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-md);
		}

		.status-controls {
			justify-content: stretch;
		}

		.connection-stats {
			grid-template-columns: 1fr;
		}

		.events-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-sm);
		}

		.event-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-xs);
		}

		.event-meta {
			flex-direction: column;
			gap: var(--spacing-xs);
		}
	}
</style>