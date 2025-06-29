# NIP-45: Counting Results

## Meta
- **Status**: draft optional
- **Category**: Relay/Query
- **Required**: optional
- **Purpose**: Enables relays to return count of events matching query without full event data

## Summary
Allows clients to request and receive counts of events matching filter criteria without transferring the actual event data.

## Core Concepts
- **COUNT verb**: New client request type for counting
- **Count responses**: Relay returns count instead of events
- **Efficient queries**: Get result counts without full data transfer
- **Pagination support**: Helps with pagination and UI indicators

## COUNT Request Format
```json
["COUNT", <subscription_id>, <filters>...]
```
- **COUNT verb**: Instead of REQ
- **Subscription ID**: Unique identifier for this count request  
- **Filters**: Standard filter objects (same as REQ)

## Count Response Format
```json
["COUNT", <subscription_id>, {"count": <number>, "approximate": <boolean>}]
```
- **COUNT response**: Matches request subscription ID
- **count**: Number of events matching filters
- **approximate**: Boolean indicating if count is exact or estimated

## Example Count Request
```json
["COUNT", "my-count-123", {"authors": ["abc123..."], "kinds": [1]}]
```

## Example Count Response
```json
["COUNT", "my-count-123", {"count": 47, "approximate": false}]
```

## Use Cases
- **Pagination**: Determine total pages before loading data
- **UI indicators**: Show "X replies" or "Y likes" without loading all
- **Statistics**: Get engagement metrics and analytics
- **Performance**: Check result size before expensive queries
- **Rate limiting**: Avoid downloading large result sets

## Filter Compatibility
COUNT supports all standard REQ filters:
- **ids**: Count specific event IDs
- **authors**: Count events by authors
- **kinds**: Count events of specific kinds
- **since/until**: Count events in time ranges
- **#tags**: Count events with specific tag values
- **limit**: Still applies to counting (may limit accuracy)

## Approximate Counts
**When approximate might be true**:
- **Very large results**: Counting millions of events
- **Performance optimization**: Relay uses estimates for speed
- **Database limitations**: Some databases provide estimates
- **Rate limiting**: Relay limits exact counting resources

**Client handling**:
- **UI indicators**: Show "~1000+" for approximate large counts
- **Exact fallback**: Request exact count if needed
- **User experience**: Handle approximate vs exact appropriately

## Relay Implementation
**Count calculation**:
- **Database query**: Use COUNT(*) SQL operations
- **Index optimization**: Leverage database indices for performance
- **Timeout protection**: Set limits on counting operations
- **Cache results**: Cache counts for frequently requested filters

**Performance considerations**:
- **Query optimization**: Use efficient counting strategies
- **Result limits**: May limit counting for very broad queries
- **Approximate thresholds**: Switch to estimates for large counts
- **Resource protection**: Prevent counting from overwhelming relay

## Client Implementation
**Count requests**:
- **Separate subscriptions**: Use unique subscription IDs for counts
- **Error handling**: Handle relays that don't support COUNT
- **Timeout handling**: Set reasonable timeouts for count requests
- **Fallback strategy**: Fall back to REQ if COUNT not supported

## Security Considerations
- **Resource exhaustion**: COUNT queries can be expensive
- **Privacy implications**: Counts may reveal information about stored data
- **Rate limiting**: Apply rate limits to COUNT requests
- **Query complexity**: Complex filters may be resource-intensive

## Limitations
- **Optional support**: Not all relays implement COUNT
- **Accuracy trade-offs**: Approximate counts trade accuracy for performance
- **Filter restrictions**: Some relays may limit which filters support counting
- **Real-time accuracy**: Counts may become stale as new events arrive

## Error Handling
**Unsupported relay**:
- **No response**: Relay ignores COUNT requests
- **NOTICE message**: Relay may send notice about unsupported feature
- **Fallback**: Client falls back to REQ and manual counting

## Related NIPs
- NIP-01 (basic query filters used in COUNT)
- NIP-11 (relay information document - could indicate COUNT support) 