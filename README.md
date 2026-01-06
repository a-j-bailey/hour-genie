# Hour Genie

A modern application for managing business operating hours, built with React Router and deployed on Cloudflare.

## Features

- 🚀 Single Page Application (SPA) - client-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the project root for local development:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8787
```

> **Note**: For local development, make sure your API is running locally (see [api/README.md](./api/README.md) for API setup).

## Building for Production

Create a production build:

```bash
npm run build
```

The build output will be in the `build/` directory:
```
├── build/
│   └── client/    # Static assets (SPA build)
```

> **Note**: This project is configured as a Single Page Application (SPA) with `ssr: false` in `react-router.config.ts`. Only the `client` directory is generated.

## Deployment to Cloudflare

This project consists of two parts that need to be deployed separately:
1. **Frontend** → Cloudflare Pages
2. **Backend API** → Cloudflare Workers (see [api/README.md](./api/README.md))

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://www.cloudflare.com) if you don't have one
2. **Wrangler CLI**: Install globally:
   ```bash
   npm install -g wrangler
   ```
3. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

### Step 1: Deploy the Backend API

First, deploy the Cloudflare Workers API. Follow the detailed instructions in [api/README.md](./api/README.md).

**Important**: Save the API URL after deployment (e.g., `https://hour-genie-api.your-subdomain.workers.dev`). You'll need it for the frontend configuration.

### Step 2: Deploy the Frontend to Cloudflare Pages

#### Option A: Deploy via Wrangler CLI (Recommended)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Pages**:
   ```bash
   wrangler pages deploy build/client
   ```

3. **Follow the prompts**:
   - If this is your first deployment, you'll be asked to create a new project
   - Enter a project name (e.g., `hour-genie`)
   - Choose a production branch (usually `main` or `master`)

4. **Save your deployment URL**: You'll get a URL like `https://hour-genie.pages.dev`

#### Option B: Deploy via Cloudflare Dashboard

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Go to Cloudflare Dashboard**:
   - Navigate to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/pages)
   - Click "Create a project"
   - Choose "Upload assets"

3. **Upload your build**:
   - Project name: `hour-genie` (or your preferred name)
   - Production branch: `main` (or your default branch)
   - Build output directory: `build/client`
   - Upload the `build/client` folder

4. **Save your deployment URL**: You'll get a URL like `https://hour-genie.pages.dev`

#### Option C: Connect Git Repository (Continuous Deployment)

1. **Go to Cloudflare Dashboard**:
   - Navigate to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/pages)
   - Click "Create a project"
   - Choose "Connect to Git"

2. **Connect your repository**:
   - Select your Git provider (GitHub, GitLab, etc.)
   - Authorize Cloudflare to access your repositories
   - Select the `hour-genie` repository

3. **Configure build settings**:
   - **Project name**: `hour-genie`
   - **Production branch**: `main` (or your default branch)
   - **Build command**: `npm run build`
   - **Build output directory**: `build/client`
   - **Root directory**: `/` (leave as default)

4. **Save and deploy**: Cloudflare will automatically build and deploy on every push to your production branch

### Step 3: Configure Environment Variables

1. **Go to your Pages project** in the Cloudflare Dashboard
2. **Navigate to Settings → Environment Variables**
3. **Add the following variables**:

   **Production:**
   ```
   VITE_SUPABASE_URL = your_supabase_project_url
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   VITE_API_URL = https://hour-genie-api.your-subdomain.workers.dev
   ```

   **Preview (optional, for branch previews):**
   ```
   VITE_SUPABASE_URL = your_supabase_project_url
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   VITE_API_URL = https://hour-genie-api.your-subdomain.workers.dev
   ```

4. **Save the variables**

> **Important**: After adding environment variables, you need to **redeploy** your Pages project for the changes to take effect. Go to Deployments → Retry deployment, or push a new commit if using Git integration.

### Step 4: Configure Custom Domain (Optional)

1. **Go to your Pages project** in the Cloudflare Dashboard
2. **Navigate to Custom domains**
3. **Click "Set up a custom domain"**
4. **Enter your domain** (e.g., `hourgenie.com`)
5. **Follow the DNS configuration instructions**
6. **Wait for DNS propagation** (usually a few minutes)

### Step 5: Verify Deployment

1. Visit your Pages URL (e.g., `https://hour-genie.pages.dev`)
2. Test that the application loads correctly
3. Verify that API calls are working (check browser console for any errors)
4. Test authentication and core features

### Updating the Deployment

#### If using Wrangler CLI:
```bash
npm run build
wrangler pages deploy build/client
```

#### If using Git integration:
Simply push to your production branch - Cloudflare will automatically build and deploy.

#### If using Dashboard upload:
1. Build locally: `npm run build`
2. Go to your Pages project → Deployments
3. Click "Upload assets" and upload the new `build/client` folder

## Environment Variables Reference

### Frontend (Cloudflare Pages)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | Yes |
| `VITE_API_URL` | Your Cloudflare Workers API URL | Yes |

### Backend (Cloudflare Workers)

See [api/README.md](./api/README.md) for backend environment variables.

## Project Structure

```
hour-genie/
├── api/                 # Cloudflare Workers API
│   ├── routes/         # API route handlers
│   ├── utils/          # Utility functions
│   └── worker.ts       # Worker entry point
├── app/                # React Router application
│   ├── components/     # React components
│   ├── routes/         # Application routes
│   └── lib/            # Library code
├── public/             # Static assets
├── wrangler.toml       # Cloudflare Workers configuration
└── package.json        # Dependencies and scripts
```

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install`
- Verify Node.js version (check `package.json` for required version)
- Check build logs in Cloudflare Dashboard

### Environment Variables Not Working
- Make sure variables are prefixed with `VITE_` for Vite to expose them
- Redeploy after adding/updating environment variables
- Check that variables are set for the correct environment (Production/Preview)

### API Calls Failing
- Verify `VITE_API_URL` is set correctly in Pages environment variables
- Check that your Workers API is deployed and accessible
- Verify CORS is configured correctly in your Worker
- Check browser console for specific error messages

### Authentication Issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project settings
- Verify Supabase authentication is properly configured

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [React Router Documentation](https://reactrouter.com/)
- [Supabase Documentation](https://supabase.com/docs)

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling. The configuration is in `vite.config.ts` and `app/app.css`.

---

Built with ❤️ using React Router and Cloudflare.
