# Cloudflare Workers API

This directory contains the Cloudflare Workers API for Hour Genie. The API handles server-side operations for managing operating hours, businesses, integrations, subscriptions, and webhooks.

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

3. **Create a `.dev.vars` file** in the `/api` directory (same directory as `wrangler.toml`). Copy `api/.dev.vars.example` and fill in your values:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_MONTHLY_PRICE_ID=your_monthly_price_id
   STRIPE_ANNUAL_PRICE_ID=your_annual_price_id
   STRIPE_MONTHLY_PAYMENT_LINK_ID=your_monthly_payment_link_id
   STRIPE_ANNUAL_PAYMENT_LINK_ID=your_annual_payment_link_id
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_from_email@example.com
   SENDGRID_REPLY_TO_EMAIL=your_reply_to@example.com
   XAI_API_KEY=your_xai_api_key
   ```
   
   > **Note**: `.dev.vars` is gitignored. Never commit real Stripe Payment Link IDs (`plink_...`), API keys, or service-role credentials. Only include the variables you need for your setup.

4. **Run the API locally** (from the `/api` directory):
   ```bash
   cd api
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

## Deployment to Cloudflare Workers

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://www.cloudflare.com) if you don't have one
2. **Wrangler CLI**: Install globally if not already installed:
   ```bash
   npm install -g wrangler
   ```
3. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```
   This will open a browser window to authenticate with Cloudflare. Wrangler uses that account; do not commit `account_id`.

### Step-by-Step Deployment

#### Step 1: Cloudflare Account

Wrangler uses the Cloudflare account from `wrangler login` or the dashboard. **Do not commit `account_id` in `wrangler.toml`.**

To confirm which account you are using:

```bash
wrangler whoami
```

If you have multiple accounts and Wrangler cannot infer the right one, set `account_id` locally (not committed) or select the account in the Cloudflare dashboard.

#### Step 2: Set Required Environment Variables (Secrets)

Set the required secrets for your Worker. These are encrypted and stored securely by Cloudflare. Run these commands from the `/api` directory:

```bash
cd api

# Required secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Optional secrets (set only if you're using these features)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_MONTHLY_PRICE_ID
wrangler secret put STRIPE_ANNUAL_PRICE_ID
wrangler secret put STRIPE_MONTHLY_PAYMENT_LINK_ID
wrangler secret put STRIPE_ANNUAL_PAYMENT_LINK_ID
wrangler secret put SENDGRID_API_KEY
wrangler secret put SENDGRID_FROM_EMAIL
wrangler secret put SENDGRID_REPLY_TO_EMAIL
wrangler secret put XAI_API_KEY
```

For each command, you'll be prompted to enter the value. The values are hidden as you type.

> **Note**: To update a secret later, just run the same command again with the new value.

#### Step 3: Deploy the Worker

From the `/api` directory, deploy the worker:

```bash
cd api
wrangler deploy
```

This will:
- Build your TypeScript code
- Upload it to Cloudflare Workers
- Deploy it to production

You'll see output showing:
- The worker name: `hour-genie-api`
- The deployment URL: `https://hour-genie-api.your-subdomain.workers.dev`

**Save this URL** - you'll need it for your frontend configuration!

#### Step 4: Configure Custom Domain (Optional)

If you want to use a custom domain instead of the `.workers.dev` subdomain:

1. Go to your Cloudflare Dashboard
2. Navigate to Workers & Pages → Your Worker → Settings → Triggers
3. Add a custom domain under "Routes"
4. Update your DNS records as instructed

#### Step 5: Set Up Stripe Webhook (If Using Stripe)

If you're using Stripe for payments:

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your Worker URL: `https://hour-genie-api.your-subdomain.workers.dev/api/stripe-webhook`
4. Select the events you want to listen to (e.g., `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`)
5. Copy the webhook signing secret
6. Set it as a secret:
   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

#### Step 6: Set Up SendGrid Inbound Parse (If Using Email Webhooks)

If you're using SendGrid for email webhooks:

1. Go to your SendGrid Dashboard → Settings → Inbound Parse
2. Add a new hostname or use an existing one
3. Set the POST URL to: `https://hour-genie-api.your-subdomain.workers.dev/api/email-webhook`
4. Configure the hostname in your DNS as instructed by SendGrid

### Updating the Deployment

To update your worker after making changes (from the `/api` directory):

```bash
cd api
wrangler deploy
```

To view logs in real-time:

```bash
cd api
wrangler tail
```

To view specific deployment logs:

```bash
cd api
wrangler deployments list
```

### Cron Jobs

The worker is configured to run a daily cron job at 9 AM UTC for holiday reminders. This is configured in `wrangler.toml`:

```toml
[triggers]
crons = ["0 9 * * *"]
```

The cron job will automatically run once deployed. No additional configuration needed.

## API Endpoints

### Business Management
- `GET /api/businesses` - List all businesses for authenticated user
- `GET /api/businesses/:id` - Get a specific business
- `POST /api/businesses` - Create a new business
- `PUT /api/businesses/:id` - Update a business
- `DELETE /api/businesses/:id` - Delete a business

### Hours Overrides
- `GET /api/businesses/:businessId/hours-overrides` - Get hours overrides for a business
- `POST /api/businesses/:businessId/hours-overrides` - Create a new hours override
- `PUT /api/hours-overrides/:id` - Update an hours override
- `DELETE /api/hours-overrides/:id` - Delete an hours override

### Integrations
- `GET /api/businesses/:businessId/integrations` - List integrations for a business
- `GET /api/businesses/:businessId/integrations/:type` - Get a specific integration
- `POST /api/businesses/:businessId/integrations` - Create a new integration
- `PUT /api/businesses/:businessId/integrations/:type` - Update an integration
- `DELETE /api/businesses/:businessId/integrations/:type` - Delete an integration

### Embed Widget
- `GET /api/embed/hours` - Get hours for embed widget (public, no auth required)

### Subscriptions
- `GET /api/subscriptions` - Get subscription for authenticated user
- `POST /api/subscriptions` - Create a new subscription
- `GET /api/subscriptions/portal` - Get Stripe customer portal URL

### Webhooks
- `POST /api/stripe-webhook` - Stripe webhook endpoint (public, signature verified)
- `POST /api/email-webhook` - SendGrid inbound parse webhook (public)

All endpoints support `OPTIONS` for CORS preflight requests.

## Authentication

Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

Public endpoints (no auth required):
- `GET /api/embed/hours`
- `POST /api/stripe-webhook`
- `POST /api/email-webhook`

## Environment Variables Reference

### Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (bypasses RLS)

### Optional (Stripe)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_MONTHLY_PRICE_ID` - Stripe price ID for monthly subscription
- `STRIPE_ANNUAL_PRICE_ID` - Stripe price ID for annual subscription
- `STRIPE_MONTHLY_PAYMENT_LINK_ID` - Stripe payment link ID for monthly
- `STRIPE_ANNUAL_PAYMENT_LINK_ID` - Stripe payment link ID for annual

### Optional (SendGrid)
- `SENDGRID_API_KEY` - SendGrid API key for sending emails
- `SENDGRID_FROM_EMAIL` - Default from email address
- `SENDGRID_REPLY_TO_EMAIL` - Default reply-to email address

### Optional (AI)
- `XAI_API_KEY` - xAI API key for AI features

## Troubleshooting

### Deployment Fails
- Check that you're logged in: `wrangler whoami`
- Confirm Wrangler is targeting the intended Cloudflare account (do not commit `account_id`)
- Check that all required secrets are set

### Worker Returns Errors
- Check logs: `wrangler tail`
- Verify all required environment variables are set
- Check that your Supabase credentials are correct

### CORS Issues
- The worker has CORS enabled for all origins by default
- For production, consider restricting CORS to your frontend domain

## Notes

- The API uses Supabase service role key to bypass Row Level Security (RLS)
- CORS is enabled for all origins (adjust in production if needed)
- The worker uses Cloudflare Workers runtime, not Node.js
- Cron jobs run automatically once deployed
- Secrets are encrypted and stored securely by Cloudflare
