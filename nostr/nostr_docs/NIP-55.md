# NIP-55: Android Signer Application

## Meta
- **Status**: draft optional
- **Category**: Mobile/Android/Signing
- **Required**: optional
- **Purpose**: Defines Android Intent-based signing for Nostr applications

## Summary
Enables Android applications to request event signing from external signer applications using Android Intents.

## Core Concepts
- **Android Intents**: Use system Intents for communication
- **External signing**: Delegate signing to specialized apps
- **Security isolation**: Keep private keys in dedicated signer apps
- **User consent**: Explicit user approval for each signing operation
- **Multiple signers**: Support for multiple signer applications

## Intent Communication Flow
1. **App creates Intent**: Application creates signing Intent
2. **System presents options**: Android shows available signer apps
3. **User selects signer**: User chooses preferred signer application
4. **Signer processes**: Signer app processes the signing request
5. **User approves**: User approves or denies the signing
6. **Result returned**: Signed event returned to requesting app

## Intent Structure

### Signing Request Intent
```java
Intent intent = new Intent("nostrsigner.SIGN_EVENT");
intent.setType("application/json");
intent.putExtra("event", unsignedEventJson);
intent.putExtra("id", requestId);
intent.putExtra("current_user", currentUserPubkey);
```

### Intent Extras
- **event**: Unsigned event JSON (required)
- **id**: Request identifier for matching response
- **current_user**: Currently active user pubkey (optional)
- **package**: Requesting app package name

## Signer Application Requirements

### Intent Filter
```xml
<activity android:name=".SigningActivity">
    <intent-filter>
        <action android:name="nostrsigner.SIGN_EVENT" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="application/json" />
    </intent-filter>
</activity>
```

### Response Format
```java
Intent result = new Intent();
result.putExtra("id", requestId);
result.putExtra("event", signedEventJson);
result.putExtra("signature", eventSignature);
setResult(RESULT_OK, result);
```

## Security Model

### Key Management
- **Secure storage**: Store private keys securely in signer app
- **No key sharing**: Never share private keys with other apps
- **User authentication**: Require user authentication to access keys
- **Key isolation**: Each signer app manages its own keys

### User Consent
- **Explicit approval**: User must approve each signing request
- **Event preview**: Show event content before signing
- **App identification**: Clearly identify requesting application
- **Denial option**: Allow users to deny signing requests

## Signer App Features

### Key Management
- **Multiple accounts**: Support multiple Nostr accounts
- **Key generation**: Generate new key pairs
- **Key backup**: Backup and restore functionality
- **Account switching**: Switch between different accounts

### Signing Interface
- **Event preview**: Display event content clearly
- **Metadata display**: Show event metadata (kind, tags, etc.)
- **Approval interface**: Clear approve/deny buttons
- **Signing confirmation**: Confirm successful signing

## Requesting App Implementation

### Intent Creation
```java
public void signEvent(String unsignedEvent, String requestId) {
    Intent intent = new Intent("nostrsigner.SIGN_EVENT");
    intent.setType("application/json");
    intent.putExtra("event", unsignedEvent);
    intent.putExtra("id", requestId);
    startActivityForResult(intent, SIGN_REQUEST_CODE);
}
```

### Result Handling
```java
@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode == SIGN_REQUEST_CODE && resultCode == RESULT_OK) {
        String signedEvent = data.getStringExtra("event");
        String requestId = data.getStringExtra("id");
        handleSignedEvent(signedEvent, requestId);
    }
}
```

## Use Cases
- **Social media apps**: Sign posts and interactions
- **Wallet applications**: Sign Lightning payment events
- **Content creation**: Sign articles and media posts
- **Gaming applications**: Sign game-related events
- **Identity verification**: Sign identity attestations

## Advanced Features

### Batch Signing
```java
intent.putExtra("events", eventsJsonArray);
intent.putExtra("batch", true);
```

### Signing Preferences
```java
intent.putExtra("auto_approve", false);
intent.putExtra("show_preview", true);
```

### Account Selection
```java
intent.putExtra("preferred_account", pubkey);
intent.putExtra("account_selection", true);
```

## Error Handling

### Common Errors
- **No signer apps**: No compatible signer applications installed
- **User denial**: User denied the signing request
- **Malformed event**: Event JSON is invalid or malformed
- **Signer error**: Internal error in signer application

### Error Responses
```java
Intent result = new Intent();
result.putExtra("id", requestId);
result.putExtra("error", "user_denied");
setResult(RESULT_CANCELED, result);
```

## Privacy Considerations
- **App permissions**: Minimal permissions required
- **Data exposure**: Only unsigned events shared with signer
- **User privacy**: Respect user privacy preferences
- **Tracking prevention**: Avoid enabling cross-app tracking

## Performance Considerations
- **Intent overhead**: Consider Intent call overhead
- **Large events**: Handle large event content appropriately
- **Battery usage**: Minimize battery impact
- **User experience**: Fast, responsive signing experience

## Compatibility
- **Android versions**: Support modern Android versions
- **Multiple signers**: Work with different signer implementations
- **Fallback options**: Provide fallbacks when no signer available
- **Standard compliance**: Follow Android development standards

## Related NIPs
- NIP-01 (basic event structure and signing)
- NIP-07 (browser extension signing - similar concept)
- NIP-46 (Nostr Connect - alternative signing approach) 