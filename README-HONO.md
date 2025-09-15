# Misiki API Server - Hono Integration

## Overview

This document explains the architecture and setup of the Hono server integration with the Misiki platform. The Hono server provides a high-performance API layer that complements the SvelteKit frontend application.

## Architecture

### Components

1. **SvelteKit Frontend**: Continues to serve the user interface and handle frontend routing.
2. **Hono API Server**: A standalone API server that handles database operations, payment processing, and subscription management.
3. **Shared Database**: Both the SvelteKit and Hono applications connect to the same Turso database.

### Benefits

- **Performance**: Hono is optimized for API requests, providing faster response times.
- **Separation of Concerns**: Clear separation between frontend and backend logic.
- **Scalability**: The API server can be deployed independently, allowing for horizontal scaling.

## API Endpoints

### Checkout API

- `POST /api/checkout/phonepe` - Process checkout with PhonePe payment gateway
- `POST /api/checkout/validate-coupon` - Validate coupon codes
- `GET /api/checkout/verify/:orderId` - Verify payment status
- `POST /api/checkout/webhook/phonepe` - PhonePe webhook for payment updates
- `POST /api/checkout/simulate-payment` - Simulate payment completion (testing only)

### Subscription API

- `GET /api/subscription/:userId` - Get user's subscription status
- `POST /api/subscription` - Create a new subscription
- `PATCH /api/subscription/:subscriptionId/cancel` - Cancel an existing subscription

## Local Development

### Starting the Application

The Hono API is integrated into the SvelteKit application. To start the development server:

```bash
bun run dev
```

This will start both the SvelteKit frontend and the integrated Hono API server.

### Environment Variables

Both services share the same environment variables. Key variables include:

```
DATABASE_URL=<turso-database-url>
DATABASE_AUTH_TOKEN=<turso-auth-token>
API_PORT=3000
```

## Deployment

The Hono API server can be deployed to any Node.js hosting environment. Ensure the environment variables are properly configured in your production environment.

## Future Enhancements

1. Authentication middleware for secure API access
2. Rate limiting to prevent abuse
3. Caching layer for frequently accessed data
4. Comprehensive logging and monitoring

---

For more information about Misiki, visit [misiki.in](https://misiki.in).
