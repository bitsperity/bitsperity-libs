# NIP-47: Wallet Connect

## Meta
- **Status**: draft optional
- **Category**: Lightning/Payments
- **Required**: optional
- **Purpose**: Enables applications to request Lightning payments from remote wallets over Nostr

## Summary
Protocol for requesting Lightning Network payments from remote wallets using encrypted communication over Nostr relays.

## Core Concepts
- **Wallet connection**: Apps connect to Lightning wallets remotely
- **Payment requests**: Request Lightning payments via Nostr
- **Encrypted communication**: All requests/responses encrypted with NIP-44
- **Permission system**: Wallets control what operations are allowed
- **Request-response**: JSON-RPC style communication pattern

## Connection Flow
1. **Wallet advertises**: Wallet publishes connection info
2. **App connects**: Application requests connection to wallet
3. **Authorization**: Wallet approves/denies connection and permissions
4. **Payment requests**: App sends payment requests to wallet

## Request Event Structure (Kind 23194)
```json
{
  "kind": 23194,
  "content": "<nip44-encrypted-request>",
  "tags": [
    ["p", "<wallet-pubkey>"]
  ]
}
```

## Response Event Structure (Kind 23195)
```json
{
  "kind": 23195,
  "content": "<nip44-encrypted-response>",
  "tags": [
    ["p", "<app-pubkey>"],
    ["e", "<request-event-id>"]
  ]
}
```

## Wallet Service Discovery
**Connection URI format**:
```
nostrwalletconnect://<pubkey>?relay=<relay-url>&secret=<secret>&lud16=<lud16>
```
- **pubkey**: Wallet's public key for communication
- **relay**: Preferred relay for communication
- **secret**: Shared secret for initial authorization
- **lud16**: Lightning address (optional)

## Request Methods

### get_info
**Request**: Get wallet information
```json
{
  "method": "get_info"
}
```

**Response**:
```json
{
  "result": {
    "alias": "My Lightning Wallet",
    "color": "#3399ff",
    "pubkey": "wallet-node-pubkey",
    "network": "mainnet",
    "block_height": 800000,
    "block_hash": "000000...",
    "methods": ["pay_invoice", "get_balance", "make_invoice"]
  }
}
```

### get_balance
**Request**: Get wallet balance
```json
{
  "method": "get_balance"
}
```

**Response**:
```json
{
  "result": {
    "balance": 50000
  }
}
```

### pay_invoice
**Request**: Pay Lightning invoice
```json
{
  "method": "pay_invoice",
  "params": {
    "invoice": "lnbc100n1p..."
  }
}
```

**Response**:
```json
{
  "result": {
    "preimage": "abc123...",
    "payment_hash": "def456..."
  }
}
```

### make_invoice
**Request**: Create Lightning invoice
```json
{
  "method": "make_invoice",
  "params": {
    "amount": 10000,
    "description": "Payment for services",
    "expiry": 3600
  }
}
```

**Response**:
```json
{
  "result": {
    "type": "incoming",
    "invoice": "lnbc100n1p...",
    "payment_hash": "abc123...",
    "amount": 10000,
    "description": "Payment for services",
    "expires_at": 1677462000
  }
}
```

### lookup_invoice
**Request**: Look up invoice status
```json
{
  "method": "lookup_invoice",
  "params": {
    "payment_hash": "abc123..."
  }
}
```

### list_transactions
**Request**: List recent transactions
```json
{
  "method": "list_transactions",
  "params": {
    "from": 1677426000,
    "until": 1677462000,
    "limit": 10,
    "offset": 0,
    "unpaid": false,
    "type": "incoming"
  }
}
```

## Permission Scopes
- **pay_invoice**: Make Lightning payments
- **get_balance**: Read wallet balance
- **get_info**: Read wallet information
- **make_invoice**: Create invoices
- **lookup_invoice**: Look up invoice status
- **list_transactions**: Read transaction history
- **sign_message**: Sign arbitrary messages

## Budget Controls
**Spending limits**:
```json
{
  "method": "pay_invoice",
  "params": {
    "invoice": "lnbc100n1p...",
    "budget": {
      "amount": 100000,
      "renewal": "monthly"
    }
  }
}
```

## Error Responses
**Common errors**:
- **PAYMENT_FAILED**: Lightning payment failed
- **INSUFFICIENT_BALANCE**: Not enough funds
- **UNAUTHORIZED**: Operation not permitted
- **RATE_LIMITED**: Too many requests
- **EXPIRED**: Invoice or session expired
- **INVALID_INVOICE**: Malformed Lightning invoice

## Use Cases
- **Zaps**: Lightning tips and donations in social apps
- **Payments**: E-commerce Lightning payments
- **Streaming sats**: Micropayments for streaming content
- **Gaming**: In-game Lightning payments
- **Subscription**: Recurring Lightning payments

## Security Considerations
- **Permission granularity**: Fine-grained permission control
- **Budget limits**: Spending limits and approval thresholds
- **Session management**: Secure session lifecycle
- **Request validation**: Validate all payment requests
- **Key isolation**: Private keys never shared with apps

## Wallet Implementation
- **Connection management**: Handle app connections
- **Permission UI**: User interface for granting permissions
- **Payment confirmation**: User confirmation for payments
- **Budget tracking**: Track spending against budgets
- **Security features**: Multi-factor auth, spending limits

## App Integration
- **Connection setup**: Guide users through wallet connection
- **Payment flow**: Smooth Lightning payment experience
- **Error handling**: Graceful handling of payment failures
- **Offline handling**: Handle wallet unavailability

## Related NIPs
- NIP-44 (encryption for secure communication)
- NIP-57 (Lightning zaps in social applications)
- NIP-05 (DNS-based discovery for wallet services) 