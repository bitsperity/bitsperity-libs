# NIP-15: Nostr Marketplace

## Meta
- **Status**: draft optional
- **Category**: Commerce/Marketplace
- **Required**: optional
- **Purpose**: Defines decentralized marketplace system for buying/selling goods via Nostr

## Summary
Complete e-commerce system built on Nostr events, enabling decentralized marketplaces with stalls, products, orders, and payments.

## Core Entity Types
- **Merchant**: Seller with Nostr keypair managing stalls/products
- **Customer**: Buyer with Nostr keypair making purchases  
- **Product**: Items for sale with metadata and pricing
- **Stall**: Collection of products controlled by merchant
- **Marketplace**: Client software for browsing/purchasing

## Event Types
- **Kind 30017**: Create/update stall (addressable event)
- **Kind 30018**: Create/update product (addressable event)
- **Kind 30019**: Marketplace UI/UX customization
- **Kind 30020**: Auction products  
- **Kind 4**: Encrypted checkout messages (NIP-04)
- **Kind 5**: Delete stall/product

## Stall Structure (Kind 30017)
```json
{
  "id": "<stall-id>",
  "name": "<stall-name>", 
  "description": "<optional-description>",
  "currency": "<currency-code>",
  "shipping": [
    {
      "id": "<zone-id>",
      "name": "<zone-name>",
      "cost": "<base-shipping-cost>",
      "regions": ["<region1>", "<region2>"]
    }
  ]
}
```

## Product Structure (Kind 30018)
```json
{
  "id": "<product-id>",
  "stall_id": "<parent-stall-id>",
  "name": "<product-name>",
  "description": "<product-description>",
  "images": ["<image-url1>", "<image-url2>"],
  "currency": "<currency-code>",
  "price": "<product-price>",
  "quantity": "<available-quantity>",
  "specs": [["<key>", "<value>"]],
  "shipping": [{"id": "<zone-id>", "cost": "<extra-cost>"}]
}
```

## Checkout Process
**Step 1**: Customer Order (Type 0)
- Encrypted message with items, quantities, shipping, contact info

**Step 2**: Payment Request (Type 1)  
- Merchant responds with payment options (URL, BTC, Lightning, LNURL)

**Step 3**: Fulfillment (Type 2)
- Merchant confirms payment received and shipping status

## Auction System
- **Kind 30020**: Auction products with starting bid, duration
- **Kind 1021**: Bid events with amount in content
- **Kind 1022**: Bid confirmation (accepted/rejected/winner)
- **Time extensions**: Bids near end can extend auction duration

## Marketplace Customization (Kind 30019)
- **UI theming**: Colors, logos, banners
- **Merchant curation**: Select specific merchants to display
- **Branding**: Custom marketplace appearance
- **naddr sharing**: Share customized marketplace configurations

## Payment Integration
- **Multiple options**: URLs, Bitcoin, Lightning, LNURL
- **Merchant choice**: Support various payment methods
- **Confirmation required**: Payment verification before fulfillment

## Security Considerations
- **Encrypted checkout**: All order details encrypted with NIP-04
- **Identity verification**: Nostr pubkeys provide merchant/customer identity
- **Dispute resolution**: Built on reputation and direct communication
- **Payment risks**: Standard e-commerce payment risks apply

## Use Cases
- **Digital goods**: Software, content, services
- **Physical products**: Traditional e-commerce items
- **Auctions**: Collectibles, unique items
- **Services**: Professional services, consultations
- **Decentralized markets**: Censorship-resistant commerce

## Related NIPs
- NIP-01 (addressable events)
- NIP-04 (encrypted messages)
- NIP-19 (naddr for marketplace sharing) 