# Cloudflare Workers API

This directory contains the Cloudflare Workers API for Hour Genie. The API handles server-side operations for managing operating hours.

## Setup

1. Install Wrangler CLI (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Update `wrangler.toml` with your account ID (get it from your first deploy or Cloudflare dashboard)

4. Set environment variables (secrets):
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

5. Install dependencies for the Worker:
   ```bash
   cd api
   npm install @supabase/supabase-js
   ```
   
   Note: Cloudflare Workers uses a different module system. You may need to adjust the imports based on your deployment setup.

## Deployment

Deploy the worker:
```bash
wrangler deploy
```

## API Endpoints

- `GET /api/operating-hours` - Get operating hours for authenticated user
- `POST /api/operating-hours` - Create/update operating hours for authenticated user
- `OPTIONS /api/operating-hours` - CORS preflight

## Authentication

All endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

## Notes

- The API uses Supabase service role key to bypass Row Level Security (RLS)
- CORS is enabled for all origins (adjust in production)
- JWT verification is simplified - enhance for production use
- The worker uses Cloudflare Workers runtime, not Node.js

