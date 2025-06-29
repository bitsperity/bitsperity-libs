# NIP-90: Data Vending Machine

## Meta
- **Status**: Draft, Optional
- **Category**: Marketplace/Computation
- **Required**: No
- **Purpose**: On-demand data processing marketplace

## Summary
Defines interaction between customers and service providers for on-demand computation. Uses job request events (kinds 5000-5999), job results (kinds 6000-6999), and feedback events (kind 7000) to create a "money in, data out" marketplace.

## Core Concepts
- **Computation Marketplace**: Users request processing, providers compete
- **Job-Based System**: Structured requests and responses
- **Payment Integration**: Lightning payments for services
- **Flexible Workflow**: Providers set their own business models
- **Service Competition**: Multiple providers can fulfill same request

## Implementation Details
### Job Request (5000-5999)
- Input data via `i` tags (URL, event, job, text)
- Output format specification
- Optional bid amount and relay preferences
- Encrypted params for privacy

### Job Result (6000-6999)
- Kind = request kind + 1000
- Contains processed output
- References original request
- Payment amount requests

### Job Feedback (7000)
- Status updates (payment-required, processing, error, success)
- Optional partial results
- Payment requests with bolt11 invoices

## Use Cases
- **AI Services**: Speech-to-text, translation, summarization
- **Image Processing**: Conversion, enhancement, analysis
- **Data Analysis**: Processing large datasets
- **Content Creation**: Automated content generation
- **Specialized Computing**: GPU-intensive tasks

## Related NIPs
- NIP-04: Encrypted parameters
- NIP-57: Lightning payments for services
- NIP-05: Service provider verification 