<!--
  DMChat - Modern NIP-17 Direct Messages
  
  Showcases NostrUnchained's powerful DM capabilities with perfect Svelte integration
-->

<script lang="ts">
	import type { NostrUnchained } from 'nostr-unchained';
	import { onMount } from 'svelte';

	// =============================================================================
	// Props - Clean Dependency Injection
	// =============================================================================
	
	interface Props {
		nostr: NostrUnchained;
	}
	
	let { nostr }: Props = $props();

	// =============================================================================
	// State - Reactive and Type-Safe
	// =============================================================================

	interface Conversation {
		pubkey: string;
		displayName: string;
		lastMessage: string;
		lastActivity: number;
		isActive: boolean;
	}

	interface DMMessage {
		id: string;
		content: string;
		senderPubkey: string;
		timestamp: number;
		isFromMe: boolean;
		subject?: string;
	}

	let conversations: Conversation[] = $state([]);
	let selectedConversation: string | null = $state(null);
	let conversationInstance: any = $state(null);
	let messages: DMMessage[] = $state([]);
	let newMessage = $state('');
	let isLoading = $state(true);
	let isSending = $state(false);
	let userPubkey = $state('');

	// =============================================================================
	// NostrUnchained Integration - Clean and Powerful
	// =============================================================================

	// Load conversations using NostrUnchained's elegant API
	async function loadConversations() {
		isLoading = true;
		try {
			// Get user's pubkey for comparison
			userPubkey = await nostr.getPublicKey();
			
			// This is the beauty of NostrUnchained - one clean method
			const summaries = nostr.dm.getConversations();
			
			conversations = summaries.map(summary => ({
				pubkey: summary.pubkey,
				displayName: summary.pubkey === userPubkey 
					? 'Me (Self-Chat)' 
					: summary.pubkey.substring(0, 8) + '...',
				lastMessage: summary.latestMessage?.content || 'No messages yet',
				lastActivity: summary.lastActivity || 0,
				isActive: summary.isActive
			})).sort((a, b) => b.lastActivity - a.lastActivity);
			
		} catch (error) {
			console.error('Failed to load conversations:', error);
		} finally {
			isLoading = false;
		}
	}

	// Select and load a conversation
	async function selectConversation(pubkey: string) {
		selectedConversation = pubkey;
		messages = [];
		
		try {
			// NostrUnchained's elegant conversation API
			conversationInstance = await nostr.dm.with(pubkey);
			
			// Subscribe to reactive messages
			conversationInstance.messages.subscribe((msgs: DMMessage[]) => {
				messages = msgs.map((msg: any) => ({
					id: msg.id,
					content: msg.content,
					senderPubkey: msg.senderPubkey,
					timestamp: msg.timestamp,
					isFromMe: msg.isFromMe,
					subject: msg.subject
				})).sort((a, b) => a.timestamp - b.timestamp);
			});
			
		} catch (error) {
			console.error('Failed to load conversation:', error);
		}
	}

	// Send a message using NostrUnchained
	async function sendMessage() {
		if (!newMessage.trim() || !conversationInstance || isSending) return;
		
		isSending = true;
		const messageToSend = newMessage.trim();
		newMessage = '';
		
		try {
			// NostrUnchained's simple, powerful send API
			const result = await conversationInstance.send(messageToSend);
			
			if (!result.success) {
				console.error('Failed to send message:', result.error);
				newMessage = messageToSend; // Restore message on failure
			}
		} catch (error) {
			console.error('Error sending message:', error);
			newMessage = messageToSend; // Restore message on failure
		} finally {
			isSending = false;
		}
	}

	// Start a new conversation
	async function startNewConversation() {
		const pubkey = prompt('Enter recipient public key:');
		if (pubkey && pubkey.length === 64) {
			await selectConversation(pubkey);
		}
	}

	// Initialize on mount
	onMount(async () => {
		await loadConversations();
		
		// Start DM inbox subscription for real-time updates
		try {
			await nostr.dm.startInboxSubscription();
		} catch (error) {
			console.error('Failed to start inbox subscription:', error);
		}
	});

	// Format timestamp
	function formatTime(timestamp: number): string {
		return new Date(timestamp * 1000).toLocaleTimeString();
	}
</script>

<div class="dm-chat">
	{#if !selectedConversation}
		<!-- Conversation List -->
		<div class="conversation-list">
			<div class="list-header">
				<h2>💬 Messages</h2>
				<button class="new-chat-btn" onclick={startNewConversation}>
					+ New Chat
				</button>
			</div>
			
			{#if isLoading}
				<div class="loading">Loading conversations...</div>
			{:else if conversations.length === 0}
				<div class="empty-state">
					<h3>No conversations yet</h3>
					<p>Start chatting with Nostr users</p>
					<button class="start-chat-btn" onclick={startNewConversation}>
						Start a conversation
					</button>
				</div>
			{:else}
				<div class="conversations">
					{#each conversations as conversation}
						<button 
							class="conversation-item"
							onclick={() => selectConversation(conversation.pubkey)}
						>
							<div class="conversation-avatar">
								{conversation.displayName.substring(0, 2).toUpperCase()}
							</div>
							<div class="conversation-info">
								<div class="conversation-name">{conversation.displayName}</div>
								<div class="conversation-preview">{conversation.lastMessage}</div>
								<div class="conversation-time">{formatTime(conversation.lastActivity)}</div>
							</div>
							{#if conversation.isActive}
								<div class="active-indicator">🟢</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Chat View -->
		<div class="chat-view">
			<div class="chat-header">
				<button class="back-btn" onclick={() => selectedConversation = null}>
					← Back
				</button>
				<div class="chat-title">
					{conversations.find(c => c.pubkey === selectedConversation)?.displayName || 'Chat'}
				</div>
			</div>
			
			<div class="messages-container">
				{#if messages.length === 0}
					<div class="no-messages">
						No messages yet. Start the conversation!
					</div>
				{:else}
					{#each messages as message}
						<div class="message" class:from-me={message.isFromMe}>
							<div class="message-content">
								{#if message.subject}
									<div class="message-subject">📌 {message.subject}</div>
								{/if}
								<div class="message-text">{message.content}</div>
								<div class="message-time">{formatTime(message.timestamp)}</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
			
			<div class="message-input">
				<input
					type="text"
					bind:value={newMessage}
					placeholder="Type a message..."
					disabled={isSending}
					onkeydown={(e) => e.key === 'Enter' && sendMessage()}
				/>
				<button 
					class="send-btn"
					disabled={!newMessage.trim() || isSending}
					onclick={sendMessage}
				>
					{isSending ? '⏳' : '📤'}
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
		background: #1a1a1a;
		color: white;
	}

	/* Conversation List Styles */
	.conversation-list {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.list-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.new-chat-btn {
		background: rgba(103, 126, 234, 0.2);
		border: 1px solid rgba(103, 126, 234, 0.5);
		color: #677eea;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new-chat-btn:hover {
		background: rgba(103, 126, 234, 0.3);
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		opacity: 0.7;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
		padding: 2rem;
		text-align: center;
	}

	.empty-state h3 {
		margin-bottom: 0.5rem;
		color: white;
	}

	.empty-state p {
		opacity: 0.7;
		margin-bottom: 2rem;
	}

	.start-chat-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		color: white;
		padding: 1rem 2rem;
		border-radius: 1rem;
		cursor: pointer;
		font-weight: 600;
		transition: transform 0.2s ease;
	}

	.start-chat-btn:hover {
		transform: translateY(-1px);
	}

	.conversations {
		flex: 1;
		overflow-y: auto;
	}

	.conversation-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 2rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		color: white;
		cursor: pointer;
		transition: background 0.2s ease;
		width: 100%;
		text-align: left;
	}

	.conversation-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.conversation-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.conversation-info {
		flex: 1;
		min-width: 0;
	}

	.conversation-name {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.conversation-preview {
		opacity: 0.7;
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.conversation-time {
		opacity: 0.5;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}

	.active-indicator {
		font-size: 0.8rem;
	}

	/* Chat View Styles */
	.chat-view {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.chat-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
	}

	.back-btn {
		background: transparent;
		border: none;
		color: #677eea;
		cursor: pointer;
		font-size: 1rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		transition: background 0.2s ease;
	}

	.back-btn:hover {
		background: rgba(103, 126, 234, 0.1);
	}

	.chat-title {
		font-weight: 600;
		font-size: 1.1rem;
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.no-messages {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		opacity: 0.5;
		text-align: center;
	}

	.message {
		display: flex;
		margin-bottom: 0.5rem;
	}

	.message.from-me {
		justify-content: flex-end;
	}

	.message-content {
		max-width: 70%;
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.1);
	}

	.message.from-me .message-content {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.message-subject {
		font-size: 0.8rem;
		opacity: 0.8;
		margin-bottom: 0.5rem;
		font-style: italic;
	}

	.message-text {
		margin-bottom: 0.25rem;
		word-wrap: break-word;
	}

	.message-time {
		font-size: 0.7rem;
		opacity: 0.5;
		text-align: right;
	}

	.message-input {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.2);
	}

	.message-input input {
		flex: 1;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 1rem;
		padding: 0.75rem 1rem;
		color: white;
		font-size: 1rem;
	}

	.message-input input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.message-input input:focus {
		outline: none;
		border-color: #677eea;
		background: rgba(255, 255, 255, 0.15);
	}

	.send-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		color: white;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
	}

	.send-btn:hover:not(:disabled) {
		transform: scale(1.05);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	@media (max-width: 768px) {
		.list-header {
			padding: 1rem;
		}

		.conversation-item {
			padding: 1rem;
		}

		.chat-header {
			padding: 1rem;
		}

		.message-input {
			padding: 1rem;
		}

		.message-content {
			max-width: 85%;
		}
	}
</style>