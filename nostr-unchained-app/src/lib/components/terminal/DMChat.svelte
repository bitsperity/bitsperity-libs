<!--
  DM Chat Interface
  
  Clean mobile-first direct messaging interface for Nostr
  Revolutionary chat UX with touch-optimized interactions
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { getService } from '../../services/ServiceContainer.js';
	import { createContextLogger } from '../../utils/Logger.js';
	import type { NostrService } from '../../services/NostrService.js';
	import type { AuthState } from '../../types/app.js';
	
	let { authState, nostr }: { authState: AuthState; nostr: any } = $props();
	
	// =============================================================================
	// Chat State Management
	// =============================================================================
	
	let conversations = $state<any[]>([]);
	let activeConversation = $state<string | null>(null);
	let activeConversationInstance = $state<any>(null); // DMConversation instance
	let messages = $state<any[]>([]);
	let isLoading = $state(false);
	let newMessage = $state('');
	let chatContainer = $state<HTMLElement>();
	
	const logger = createContextLogger('DMChat');
	
	// =============================================================================
	// Lifecycle & Data Loading
	// =============================================================================
	
	onMount(async () => {
		// 🎁 SHOWCASE: Lazy Loading DM System!
		// Gift wrap subscription starts automatically when first DM is accessed
		logger.info('🎯 DM module ready - lazy loading gift wrap subscriptions on demand!');
		
		// No need to manually start subscriptions - nostr-unchained handles this elegantly!
		
		await loadConversations();
	});
	
	async function loadConversations() {
		isLoading = true;
		try {
			const nostrService = await getService<NostrService>('nostr');
			
			// Use the Library's DM API instead of manual parsing
			// This handles NIP-17 decryption and proper conversation grouping
			const conversationSummaries = nostrService.nostr.dm.getConversations();
			
			// Convert Library format to App format
			conversations = conversationSummaries.map(summary => ({
				partnerId: summary.pubkey,
				partnerName: summary.pubkey === authState.publicKey 
					? 'Me (Self-Chat)' 
					: summary.pubkey.substring(0, 8) + '...',
				lastMessage: summary.latestMessage?.content || 'No messages yet',
				lastTime: summary.lastActivity || 0,
				unread: 0,
				isActive: summary.isActive
			})).sort((a, b) => b.lastTime - a.lastTime);
			
			logger.info('Loaded conversations', { count: conversations.length });
		} catch (error) {
			logger.error('Failed to load conversations', { error });
		} finally {
			isLoading = false;
		}
	}
	
	async function openConversation(partnerId: string) {
		activeConversation = partnerId;
		
		try {
			// 🎁 SHOWCASE: Lazy Loading Magic! 
			// This is when gift wrap subscription starts!
			console.log('🎁 Triggering lazy gift wrap subscription with dm.with()');
			
			const conversation = nostr.dm.with(partnerId);
			activeConversationInstance = conversation;
			
			// Subscribe to the reactive conversation store  
			if (conversation && conversation.messages) {
				conversation.messages.subscribe((conversationMessages: any[]) => {
					console.log('💬 Reactive DM messages:', conversationMessages.length);
					
					// Convert DMMessage format to our UI format
					messages = conversationMessages.map((msg: any) => ({
						id: msg.id,
						content: msg.content,
						fromMe: msg.isFromMe,
						timestamp: msg.timestamp,
						pubkey: msg.senderPubkey,
						status: msg.status
					}));
					
					// Auto-scroll to bottom when new messages arrive
					setTimeout(() => {
						if (chatContainer) {
							chatContainer.scrollTop = chatContainer.scrollHeight;
						}
					}, 50);
				});
				
				logger.info('🚀 Lazy loading DM subscription active!', { partnerId });
			}
		} catch (error) {
			logger.error('Failed to open conversation', { error });
		}
	}
	
	async function loadMessages(partnerId: string) {
		isLoading = true;
		try {
			const nostrService = await getService<NostrService>('nostr');
			
			// For DMs, we need to look for both encrypted messages (kind 4) and gift-wrapped messages (kind 1059)
			const messageEvents = await nostrService.query()
				.kinds([4, 1059]) // Include both legacy DMs and NIP-17 gift-wrapped messages
				.authors([authState.publicKey!, partnerId])
				.limit(100)
				.execute();
			
			// Filter and format messages
			messages = messageEvents
				?.filter(event => {
					// Check if message involves both parties
					const pTag = event.tags.find((t: any) => t[0] === 'p')?.[1];
					
					// Special case: self-messages (sender and recipient are the same)
					if (authState.publicKey === partnerId) {
						return event.pubkey === authState.publicKey && pTag === authState.publicKey;
					}
					
					// Normal case: messages between two different parties
					return (
						(event.pubkey === authState.publicKey && pTag === partnerId) ||
						(event.pubkey === partnerId && pTag === authState.publicKey)
					);
				})
				.map(event => ({
					id: event.id,
					content: event.content,
					fromMe: event.pubkey === authState.publicKey,
					timestamp: event.created_at,
					pubkey: event.pubkey
				}))
				.sort((a, b) => a.timestamp - b.timestamp) || [];
			
			// Scroll to bottom
			setTimeout(() => {
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			}, 100);
			
		} catch (error) {
			logger.error('Failed to load messages', { error });
		} finally {
			isLoading = false;
		}
	}
	
	async function sendMessage() {
		if (!newMessage.trim() || !activeConversation) return;
		
		try {
			// Add detailed debugging for the browser environment
			console.log('🔍 DMChat sendMessage debug:', {
				hasActiveConversation: !!activeConversationInstance,
				hasSendMethod: !!(activeConversationInstance?.send),
				conversationType: typeof activeConversationInstance,
				messageToSend: newMessage.trim()
			});
			
			// Use the reactive conversation instance to send message
			if (activeConversationInstance && activeConversationInstance.send) {
				console.log('🚀 Attempting to send via conversation instance...');
				const result = await activeConversationInstance.send(newMessage.trim());
				
				console.log('📤 Send result:', result);
				
				if (result.success) {
					newMessage = '';
					logger.info('Message sent via reactive conversation', { messageId: result.messageId });
					// Messages will automatically appear via the reactive subscription
				} else {
					throw new Error(result.error || 'Failed to send message');
				}
			} else {
				// Fallback to service method
				console.log('🔄 Using service fallback...');
				const nostrService = await getService<NostrService>('nostr');
				const result = await nostrService.publishDM(activeConversation, newMessage.trim());
				
				if (result.success) {
					newMessage = '';
					logger.info('Message sent via service fallback');
				} else {
					throw new Error('Failed to send message via service');
				}
			}
		} catch (error) {
			console.error('❌ Detailed error in sendMessage:', {
				error: error,
				message: error.message,
				stack: error.stack,
				activeConversation,
				activeConversationInstanceType: typeof activeConversationInstance
			});
			logger.error('Failed to send message', { error });
			alert('Fehler beim Senden der Nachricht: ' + (error.message || 'Unbekannter Fehler'));
		}
	}
	
	function formatTime(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		const now = new Date();
		const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
		
		if (diffHours < 24) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
	}
	
	function goBack() {
		activeConversation = null;
		activeConversationInstance = null;
		messages = [];
	}

	function startNewConversation() {
		// For now, show a simple prompt - in a real app this would be a proper modal
		const recipientPubkey = prompt('Gib die npub oder pubkey des Empfängers ein (leer lassen für Self-Chat):');
		if (recipientPubkey !== null) {
			// If empty, use own pubkey for self-chat
			let pubkey = recipientPubkey.trim() || authState.publicKey!;
			
			if (pubkey.startsWith('npub')) {
				// TODO: Convert npub to hex pubkey
				alert('npub-Konvertierung noch nicht implementiert. Bitte verwende die hex pubkey.');
				return;
			}
			
			if (pubkey.length === 64 && /^[0-9a-fA-F]+$/.test(pubkey)) {
				// Add to conversations if not already there
				if (!conversations.find(c => c.partnerId === pubkey)) {
					conversations.unshift({
						partnerId: pubkey,
						partnerName: pubkey === authState.publicKey ? 'Me (Self-Chat)' : pubkey.substring(0, 8) + '...',
						lastMessage: 'New conversation',
						lastTime: Math.floor(Date.now() / 1000),
						unread: 0
					});
				}
				openConversation(pubkey);
			} else {
				alert('Ungültige pubkey. Muss 64 Zeichen hex format sein.');
			}
		}
	}
</script>

<!-- DM Chat Interface -->
<div class="dm-chat">
	{#if !activeConversation}
		<!-- Conversation List -->
		<div class="conversation-list">
			<div class="chat-header">
				<h3>💬 Messages</h3>
				<button class="new-chat-btn" onclick={startNewConversation} title="New conversation">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M12 5v14"/>
						<path d="M5 12h14"/>
					</svg>
				</button>
			</div>
			
			{#if isLoading}
				<div class="loading-state">
					<div class="spinner"></div>
					<span>Loading conversations...</span>
				</div>
			{:else if conversations.length === 0}
				<div class="empty-state">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
					</svg>
					<h4>No conversations yet</h4>
					<p>Start chatting with Nostr users</p>
				</div>
			{:else}
				<div class="conversations">
					{#each conversations as conv}
						<button 
							class="conversation-item"
							onclick={() => openConversation(conv.partnerId)}
						>
							<div class="conv-avatar">
								{conv.partnerName.substring(0, 2).toUpperCase()}
							</div>
							<div class="conv-content">
								<div class="conv-header">
									<span class="conv-name">{conv.partnerName}</span>
									<span class="conv-time">{formatTime(conv.lastTime)}</span>
								</div>
								<div class="conv-preview">
									{conv.lastMessage.substring(0, 50)}...
								</div>
							</div>
							{#if conv.unread > 0}
								<div class="unread-badge">{conv.unread}</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Active Chat -->
		<div class="active-chat">
			<!-- Chat Header -->
			<div class="chat-header">
				<button class="back-btn" onclick={goBack}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M19 12H5"/>
						<path d="M12 19l-7-7 7-7"/>
					</svg>
				</button>
				<div class="chat-info">
					<h3>{conversations.find(c => c.partnerId === activeConversation)?.partnerName || (activeConversation === authState.publicKey ? 'Me (Self-Chat)' : activeConversation?.substring(0, 8) + '...')}</h3>
					<span class="status">🟢 Active</span>
				</div>
				<button class="chat-options" title="Chat options">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<circle cx="12" cy="12" r="1"/>
						<circle cx="19" cy="12" r="1"/>
						<circle cx="5" cy="12" r="1"/>
					</svg>
				</button>
			</div>
			
			<!-- Messages Container -->
			<div bind:this={chatContainer} class="messages-container">
				{#if isLoading}
					<div class="loading-messages">
						<div class="spinner"></div>
					</div>
				{:else}
					{#each messages as message}
						<div class="message {message.fromMe ? 'from-me' : 'from-them'}">
							<div class="message-bubble">
								<div class="message-content">{message.content}</div>
								<div class="message-time">{formatTime(message.timestamp)}</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
			
			<!-- Message Input -->
			<div class="message-input">
				<input
					type="text"
					bind:value={newMessage}
					placeholder="Type a message..."
					onkeydown={(e) => e.key === 'Enter' && sendMessage()}
					class="input-field"
				>
				<button 
					class="send-btn"
					onclick={sendMessage}
					disabled={!newMessage.trim()}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<line x1="22" y1="2" x2="11" y2="13"/>
						<polygon points="22,2 15,22 11,13 2,9 22,2"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.dm-chat {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(20px);
		border-radius: 1rem;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	/* Chat Header */
	.chat-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #ffffff;
	}

	.new-chat-btn, .back-btn, .chat-options {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: #94a3b8;
		padding: 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new-chat-btn:hover, .back-btn:hover, .chat-options:hover {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}

	.chat-info {
		flex: 1;
		text-align: center;
	}

	.chat-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
	}

	.status {
		font-size: 0.75rem;
		color: #10b981;
	}

	/* Conversation List */
	.conversation-list {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.conversations {
		flex: 1;
		overflow-y: auto;
	}

	.conversation-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: none;
		border: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition: background 0.2s ease;
		text-align: left;
	}

	.conversation-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.conv-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: white;
		font-size: 0.875rem;
	}

	.conv-content {
		flex: 1;
		min-width: 0;
	}

	.conv-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.conv-name {
		font-weight: 600;
		color: #ffffff;
		font-size: 0.875rem;
	}

	.conv-time {
		font-size: 0.75rem;
		color: #64748b;
		font-family: var(--font-mono);
	}

	.conv-preview {
		font-size: 0.875rem;
		color: #94a3b8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.unread-badge {
		background: #ef4444;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		min-width: 20px;
		text-align: center;
	}

	/* Active Chat */
	.active-chat {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.message {
		display: flex;
		justify-content: flex-start;
	}

	.message.from-me {
		justify-content: flex-end;
	}

	.message-bubble {
		max-width: 80%;
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		position: relative;
	}

	.message.from-me .message-bubble {
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
		color: white;
		border-bottom-right-radius: 0.25rem;
	}

	.message.from-them .message-bubble {
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border-bottom-left-radius: 0.25rem;
	}

	.message-content {
		line-height: 1.5;
		word-wrap: break-word;
	}

	.message-time {
		font-size: 0.75rem;
		opacity: 0.7;
		margin-top: 0.25rem;
		font-family: var(--font-mono);
	}

	/* Message Input */
	.message-input {
		display: flex;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.input-field {
		flex: 1;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 1rem;
		padding: 0.75rem 1rem;
		color: #ffffff;
		font-size: 0.875rem;
		outline: none;
		transition: all 0.2s ease;
	}

	.input-field:focus {
		border-color: #6366f1;
		box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
	}

	.input-field::placeholder {
		color: #64748b;
	}

	.send-btn {
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
		border: none;
		color: white;
		padding: 0.75rem;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.send-btn:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 5px 15px rgba(99, 102, 241, 0.3);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Loading & Empty States */
	.loading-state, .empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: #94a3b8;
		flex: 1;
	}

	.loading-messages {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-top: 2px solid #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.empty-state svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		color: #ffffff;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Touch Optimizations */
	@media (hover: none) and (pointer: coarse) {
		.conversation-item {
			padding: 1.25rem 1.5rem;
		}
		
		.conv-avatar {
			width: 52px;
			height: 52px;
		}
		
		.message-input {
			padding: 1.25rem 1.5rem;
		}
		
		.input-field {
			padding: 1rem 1.25rem;
		}
		
		.send-btn {
			padding: 1rem;
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.chat-header {
			padding: 1rem;
		}
		
		.conversation-item {
			padding: 1rem;
		}
		
		.message-input {
			padding: 1rem;
		}
		
		.messages-container {
			padding: 0.75rem;
		}
	}
</style>