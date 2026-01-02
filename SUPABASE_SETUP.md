# Supabase Setup Guide

This guide will help you set up Supabase for the Hour Genie application.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - Name: `hour-genie` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the region closest to your users
5. Click "Create new project" and wait for it to be provisioned

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this will be your `VITE_SUPABASE_URL`)
   - **anon public** key (this will be your `VITE_SUPABASE_ANON_KEY`)
   - **service_role** key (this will be your `SUPABASE_SERVICE_ROLE_KEY` for the Cloudflare Worker)

⚠️ **Important**: Never expose the `service_role` key in client-side code. Only use it in server-side environments (like Cloudflare Workers).

## 3. Create the Database Table

1. In your Supabase project dashboard, go to **SQL Editor**
2. Run the following SQL to create the `operating_hours` table:

```sql
-- Create operating_hours table
CREATE TABLE operating_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, day_of_week)
);

-- Create index for faster queries
CREATE INDEX idx_operating_hours_user_id ON operating_hours(user_id);

-- Enable Row Level Security
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own operating hours
CREATE POLICY "Users can view their own operating hours"
  ON operating_hours
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own operating hours
CREATE POLICY "Users can insert their own operating hours"
  ON operating_hours
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own operating hours
CREATE POLICY "Users can update their own operating hours"
  ON operating_hours
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own operating hours
CREATE POLICY "Users can delete their own operating hours"
  ON operating_hours
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_operating_hours_updated_at
  BEFORE UPDATE ON operating_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. Click "Run" to execute the SQL

## 4. Set Up Environment Variables

### Client-Side (`.env` file in project root)

Create a `.env` file in the root of your project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_cloudflare_workers_api_url
```

Replace the values with the ones from step 2.

### Cloudflare Workers

When deploying your Cloudflare Worker, set the following secrets:

```bash
wrangler secret put SUPABASE_URL
# Paste your Supabase project URL when prompted

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste your Supabase service_role key when prompted
```

Or use the Cloudflare Dashboard:
1. Go to your Worker in Cloudflare Dashboard
2. Navigate to Settings → Variables
3. Add the secrets under "Encrypted" variables

## 5. Enable Email Authentication

1. In your Supabase project dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed (optional)
4. For development, you can disable "Confirm email" in **Authentication** → **Settings** → **Email Auth**

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the login page
3. Try creating an account with a test email
4. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created

## Notes

- The `day_of_week` field uses integers: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- Row Level Security (RLS) policies ensure users can only access their own data
- The Cloudflare Worker uses the `service_role` key to bypass RLS for server-side operations
- The `updated_at` field is automatically updated when a row is modified

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure your `.env` file exists and has the correct variable names
- Restart your development server after creating/updating `.env`

### Authentication not working
- Check that Email provider is enabled in Supabase
- Verify your API keys are correct
- Check browser console for error messages

### Database errors
- Make sure you've run the SQL script to create the table
- Check that RLS policies are enabled and correct
- Verify user permissions in Supabase dashboard

