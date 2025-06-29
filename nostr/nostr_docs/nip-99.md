# NIP-99: Classified Listings

## Meta
- **Status**: Draft, Optional
- **Category**: Commerce/Classifieds
- **Required**: No
- **Purpose**: Classified listings for products, services, and offerings

## Summary
Defines addressable events (kind 30402/30403) for classified listings selling products, services, or other offerings. Provides structured metadata for broad range of classified content distinct from structured marketplaces.

## Core Concepts
- **Broad Categories**: Physical goods, services, work, rentals, giveaways
- **Structured Metadata**: Standardized tags for listing information
- **Draft Support**: Kind 30403 for inactive/draft listings
- **Markdown Content**: Rich text descriptions
- **Flexible Pricing**: Various pricing models and currencies

## Implementation Details
### Listing Event (30402)
- Addressable event with unique identifier
- Markdown content for description
- Author pubkey is listing creator
- Status tracking (active/sold)

### Required Metadata Tags
- `title`: Listing title
- `summary`: Short tagline
- `published_at`: First publication timestamp
- `location`: Geographic location
- `price`: Amount, currency, frequency array

### Optional Enhancement Tags
- `t`: Hashtags for categorization
- `image`: NIP-58 style image tags
- `g`: Geohash for precise location
- Status indicators

## Use Cases
- **Local Commerce**: Community buying and selling
- **Service Marketplace**: Professional services advertising
- **Job Postings**: Employment and gig opportunities
- **Real Estate**: Property rentals and sales
- **Community Exchange**: Free items and skill trading

## Related NIPs
- NIP-23: Long-form content structure
- NIP-58: Image tag specifications
- NIP-15: Structured marketplaces (different use case) 