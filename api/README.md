# Cloudflare Workers API

This directory contains the Cloudflare Workers API for Hour Genie. The API handles server-side operations for managing operating hours.

## Local Development

To run the API locally for development:

1. **Install Wrangler CLI** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare** (required for local dev):
   ```bash
   wrangler login
   ```

3. **Create a `.dev.vars` file** in the project root (same directory as `wrangler.toml`):
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   
   > **Note**: `.dev.vars` is automatically ignored by git. Replace the values with your actual Supabase credentials.

4. **Run the API locally**:
   ```bash
   wrangler dev
   ```
   
   This will start the worker on `http://localhost:8787` by default.

5. **Update your frontend `.env` file** to point to the local API:
   ```env
   VITE_API_URL=http://localhost:8787
   ```

6. **Start your frontend** (in a separate terminal):
   ```bash
   npm run dev
   ```

## Setup for Deployment

1. **Update `wrangler.toml`** with your account ID (get it from your first deploy or Cloudflare dashboard)

2. **Set environment variables (secrets) for production**:
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

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

