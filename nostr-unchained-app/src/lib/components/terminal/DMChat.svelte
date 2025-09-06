<!--
  DM Chat Interface
  
  Clean mobile-first direct messaging interface for Nostr
  Revolutionary chat UX with touch-optimized interactions
-->

<script lang="ts">
	import { onMount } from 'svelte';
    import { createContextLogger } from '../../utils/Logger.js';
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
	let inboxStore: any = null; // Store for decrypted kind 14 events addressed to me
	let wrapStore: any = null; // Store for gift wraps (1059) addressed to me
	let lastWrapCount = 0;
	let liveWrapHandle: any = null; // live sub to ensure cache filling
	
	const logger = createContextLogger('DMChat');
	
	// =============================================================================
	// Lifecycle & Data Loading
	// =============================================================================
	
	onMount(async () => {
		// 🎁 SHOWCASE: Lazy Loading DM System!
		// Gift wrap subscription starts automatically when first DM is accessed
		logger.info('🎯 DM module ready - lazy loading gift wrap subscriptions on demand!');
		
		// Sicherstellen, dass die GiftWrap-Inbox-Subscription aktiv ist
		try {
			// Warten bis PublicKey vorhanden ist (Signer fertig), dann verbinden und Sub starten
			if (!authState?.publicKey) {
				await new Promise(resolve => setTimeout(resolve, 50));
			}
			try { await nostr.connect(); } catch {}
			await nostr.startUniversalGiftWrapSubscription();
			if (localStorage.getItem('nostr_debug') === '1') console.log('🎁 Gift wrap subscription already active - skipping');
		} catch {}
		
		// No need to manually decrypt – UniversalEventCache liefert bereits entpackte Rumors (kind 14)
		await initializeInboxDiscovery();
		await initializeWrapMonitor();
		await debugSnapshot('after-initialize');
		
		// Listen for custom events to auto-open conversations
        const dmChatElement = document.querySelector('.dm-chat');
        if (dmChatElement) {
            (dmChatElement as any).addEventListener('openConversation', (event: any) => {
                const { pubkey } = event?.detail || {};
				if (pubkey) {
					if (localStorage.getItem('nostr_debug') === '1') console.log('🎯 Auto-opening conversation with:', pubkey);
					// Add to conversations if not already there
					if (!conversations.find(c => c.partnerId === pubkey)) {
						conversations.unshift({
							partnerId: pubkey,
							partnerName: pubkey === authState.publicKey ? 'Me (Self-Chat)' : pubkey.substring(0, 8) + '...',
							lastMessage: 'New conversation',
							lastTime: Math.floor(Date.now() / 1000),
							unread: 0,
							isActive: false
						});
					}
					openConversation(pubkey);
				}
			});
		}
	});
	
	async function initializeInboxDiscovery() {
		isLoading = true;
		try {
			if (!nostr || !authState?.publicKey) {
				conversations = [];
				return;
			}
			// Alle entschlüsselten DMs (kind 14) an mich lesen und live verfolgen
			inboxStore = nostr
				.query()
				.kinds([14])
				.tags('p', [authState.publicKey])
				.execute();

			// Initiale Füllung aus Cache
			updateConversationsFromEvents(inboxStore.current || []);
			if (localStorage.getItem('nostr_debug') === '1') console.log('📥 Inbox (kind14) initial:', inboxStore.current?.length || 0);

			// Live-Updates
			inboxStore.subscribe((events: any[]) => {
				if (localStorage.getItem('nostr_debug') === '1') console.log('📨 Inbox (kind14) update:', events?.length || 0);
				updateConversationsFromEvents(events);
			});
        } catch (error) {
			logger.error('Failed to initialize inbox discovery', undefined, String(error));
		} finally {
			isLoading = false;
		}
	}

	async function debugSnapshot(label: string) {
		try {
			if (!nostr || !authState?.publicKey) return;
			const wraps = nostr.query().kinds([1059]).tags('p', [authState.publicKey]).limit(50).execute().current || [];
			const dms = nostr.query().kinds([14]).tags('p', [authState.publicKey]).limit(50).execute().current || [];
			console.log(`[DMChat ${label}] cache snapshot for ${authState.publicKey.slice(0,8)}..`);
			console.log(`  giftwraps(1059)->me: ${wraps.length}`);
			if (wraps.length) {
				const w = wraps.slice(-3);
				w.forEach((e: any, i: number) => console.log(`   • wrap#${wraps.length-3+i+1}: ${String(e.id).slice(0,8)}.. from ${String(e.pubkey).slice(0,8)}..`));
			}
			console.log(`  dms(14)->me: ${dms.length}`);
			if (dms.length) {
				const last = dms[dms.length-1];
				console.log(`   • last dm: kind=${last.kind} from=${String(last.pubkey).slice(0,8)}.. at=${last.created_at} content="${String(last.content).slice(0,60)}${String(last.content).length>60?'…':''}"`);
			}
		} catch {}
	}

	async function initializeWrapMonitor() {
		try {
			if (!nostr || !authState?.publicKey) return;
			wrapStore = nostr
				.query()
				.kinds([1059])
				.tags('p', [authState.publicKey])
				.execute();
			lastWrapCount = wrapStore.current?.length || 0;
			if (localStorage.getItem('nostr_debug') === '1') console.log('📥 GiftWraps (1059) initial:', lastWrapCount);
			wrapStore.subscribe((events: any[]) => {
				const count = events?.length || 0;
				if (count !== lastWrapCount) {
					const recent = (events || []).slice(-3);
					if (localStorage.getItem('nostr_debug') === '1') {
						console.log('📨 GiftWraps (1059) update:', count);
						recent.forEach((e: any, i: number) => console.log(`   • wrap#${count-3+i+1}: ${String(e.id).slice(0,8)}.. from ${String(e.pubkey).slice(0,8)}..`));
					}
					lastWrapCount = count;
				}
			});

			// Start a live subscription to ensure relay → cache flow even if universal sub laggt
			try {
				liveWrapHandle = await nostr
					.sub()
					.kinds([1059])
					.tags('p', [authState.publicKey])
					.limit(100)
					.execute();
				if (localStorage.getItem('nostr_debug') === '1') console.log('📡 Live 1059 sub (component) started');
			} catch (e) {
				console.warn('Live 1059 sub failed:', e);
			}
		} catch (error) {
			console.warn('Wrap monitor init failed:', error);
		}
	}

	function updateConversationsFromEvents(events: any[]) {
		// Gruppiere nach Absender (event.pubkey) und erzeuge Zusammenfassung
		const bySender = new Map<string, any[]>();
		for (const ev of events) {
			if (!ev || typeof ev !== 'object') continue;
			const sender = ev.pubkey;
			if (!sender) continue;
			if (!bySender.has(sender)) bySender.set(sender, []);
			bySender.get(sender)!.push(ev);
		}

		const convs = Array.from(bySender.entries()).map(([sender, evs]) => {
			const sorted = evs.slice().sort((a, b) => b.created_at - a.created_at);
			const latest = sorted[0];
			return {
				partnerId: sender,
				partnerName: sender === authState.publicKey ? 'Me (Self-Chat)' : sender.substring(0, 8) + '...',
				lastMessage: latest?.content || '',
				lastTime: latest?.created_at || Math.floor(Date.now() / 1000),
				unread: 0,
				isActive: activeConversation === sender
			};
		});

		// Sortiere Gespräche nach letzter Aktivität
		conversations = convs.sort((a, b) => b.lastTime - a.lastTime);

		// Optional: Falls keine aktive Konversation gesetzt ist, erste automatisch öffnen
		if (!activeConversation && conversations.length > 0) {
			openConversation(conversations[0].partnerId);
		}
	}
	
	async function openConversation(partnerId: string) {
		activeConversation = partnerId;
		
		try {
			// 🎁 SHOWCASE: Lazy Loading Magic! 
			// This is when gift wrap subscription starts!
			if (localStorage.getItem('nostr_debug') === '1') console.log('🎁 Triggering lazy gift wrap subscription with getDM().with()');
			
			// Use the correct API: getDM() returns DMModule or undefined
			const dmModule = nostr.getDM();
			if (!dmModule) {
				throw new Error('DM module not available');
			}
			
			const conversation = dmModule.with(partnerId);
			activeConversationInstance = conversation;
			
			// Subscribe to the reactive conversation store  
			if (conversation) {
				conversation.subscribe((conversationMessages: any[]) => {
					if (localStorage.getItem('nostr_debug') === '1') console.log('💬 Reactive DM messages:', conversationMessages.length);
					
					// Convert DMMessage format to our UI format
					messages = conversationMessages.map((msg: any) => ({
						id: msg.eventId || msg.id,
						content: msg.content,
						fromMe: msg.isFromMe,
						timestamp: msg.timestamp,
						pubkey: msg.senderPubkey || msg.sender,
						status: msg.status || 'received'
					}));
					
					// Auto-scroll to bottom when new messages arrive
					setTimeout(() => {
						if (chatContainer) {
							chatContainer.scrollTop = chatContainer.scrollHeight;
						}
					}, 50);
				});
				
                logger.info('🚀 Lazy loading DM subscription active!', undefined, { partnerId });
			}
		} catch (error) {
            logger.error('Failed to open conversation', undefined, String(error));
		}
	}
	
	// This function is no longer needed since we use reactive subscriptions
	
	async function sendMessage() {
		if (!newMessage.trim() || !activeConversation || !activeConversationInstance) return;
		
		try {
			if (localStorage.getItem('nostr_debug') === '1') console.log('🔍 DMChat sendMessage debug:', {
				hasActiveConversation: !!activeConversationInstance,
				hasSendMethod: !!(activeConversationInstance?.send),
				messageToSend: newMessage.trim()
			});
			
			// Use the reactive conversation instance to send message
			if (localStorage.getItem('nostr_debug') === '1') console.log('🚀 Sending message via conversation instance...');
			const result = await activeConversationInstance.send(newMessage.trim());
			
			if (localStorage.getItem('nostr_debug') === '1') console.log('📤 Send result:', result);
			
			if (result && result.success) {
				newMessage = '';
				logger.info('Message sent successfully');
				// Messages will automatically appear via the reactive subscription
			} else {
				throw new Error(result?.error || 'Failed to send message');
			}
        } catch (error) {
            console.error('❌ Error sending message:', error);
            logger.error('Failed to send message', undefined, String(error));
            alert('Error sending message: ' + ((error as any)?.message || 'Unknown error'));
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
		const recipientPubkey = prompt('Enter recipient pubkey or npub (leave empty for self-chat):');
		if (recipientPubkey !== null) {
			// If empty, use own pubkey for self-chat
			let input = recipientPubkey.trim();
			let pubkey: string;
			
			if (!input) {
				pubkey = authState.publicKey!;
			} else if (input.startsWith('npub')) {
				try {
					// Convert npub to hex using nostr-unchained utility
                    pubkey = (nostr.utils?.npubToHex?.(input) as string) || '';
					if (!pubkey) {
						// Fallback: manual bech32 decode if utils not available
                    pubkey = npubToHex(input);
					}
				} catch (error) {
					alert('Invalid npub format. Please check the npub and try again.');
					return;
				}
			} else {
				pubkey = input;
			}
			
			// Validate hex pubkey format
			if (pubkey.length === 64 && /^[0-9a-fA-F]+$/i.test(pubkey)) {
				// Add to conversations if not already there
				if (!conversations.find(c => c.partnerId === pubkey)) {
					conversations.unshift({
						partnerId: pubkey,
						partnerName: pubkey === authState.publicKey ? 'Me (Self-Chat)' : pubkey.substring(0, 8) + '...',
						lastMessage: 'New conversation',
						lastTime: Math.floor(Date.now() / 1000),
						unread: 0,
						isActive: false
					});
				}
				openConversation(pubkey);
			} else {
                alert('Invalid pubkey format. Must be 64 character hex format or valid npub.');
			}
		}
	}
	
	// Simple npub to hex conversion using bech32 decode
	function npubToHex(npub: string): string {
		try {
			// Basic bech32 decode for npub
			// This is a simplified implementation - for better support use @scure/base
			
			const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
            // (generator constants omitted)
			
			function bech32Decode(bech: string) {
				const pos = bech.lastIndexOf('1');
				if (pos < 1 || pos > bech.length - 7) {
					throw new Error('Invalid bech32 string');
				}
				
				const hrp = bech.slice(0, pos);
				const data = bech.slice(pos + 1);
				
				if (hrp !== 'npub') {
					throw new Error('Not a valid npub');
				}
				
				const decoded = [];
				for (let i = 0; i < data.length; i++) {
					const char = data[i];
					const index = CHARSET.indexOf(char);
					if (index === -1) {
						throw new Error('Invalid character in bech32 string');
					}
					decoded.push(index);
				}
				
				// Convert from 5-bit to 8-bit groups
				const payload = [];
				let acc = 0;
				let bits = 0;
				
				for (let i = 0; i < decoded.length - 6; i++) {
					acc = (acc << 5) | decoded[i];
					bits += 5;
					
					if (bits >= 8) {
						bits -= 8;
						payload.push((acc >> bits) & 255);
					}
				}
				
				// Convert to hex
				return payload.map(b => b.toString(16).padStart(2, '0')).join('');
			}
			
            return bech32Decode(npub ?? '');
		} catch (error) {
            throw new Error('Could not convert npub to hex: ' + (error as any)?.message);
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