# OAuth Multi-Account Setup Guide

## Quick Start

### 1. Database Setup

You need a PostgreSQL database. Choose one option:

#### Option A: Supabase (Recommended - Free)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection string from Settings → Database
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

#### Option B: Neon (Free)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

#### Option C: Local PostgreSQL
```bash
# If you have PostgreSQL installed locally
DATABASE_URL="postgresql://postgres:password@localhost:5432/oxford_auth"
```

### 2. Update Environment Variables

Edit `.env.local` and add your database URL:

```env
DATABASE_URL="your-postgresql-connection-string-here"
```

### 3. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Configure OAuth Apps

For each platform, create a developer app and set the callback URL to:
```
http://localhost:3000/api/auth/callback/{provider}
```

#### Google (YouTube)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add callback URL: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

#### Facebook
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app
3. Add Facebook Login product
4. Add callback URL: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and App Secret to `.env.local`

#### Twitter/X
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a new app
3. Enable OAuth 2.0
4. Add callback URL: `http://localhost:3000/api/auth/callback/twitter`
5. Copy Client ID and Client Secret to `.env.local`

#### TikTok
1. Go to [developers.tiktok.com](https://developers.tiktok.com)
2. Register as a developer
3. Create an app
4. Add Login Kit
5. Add callback URL: `http://localhost:3000/api/auth/callback/tiktok`
6. Copy Client Key and Client Secret to `.env.local`

#### Instagram
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app with Instagram Basic Display
3. Add callback URL: `http://localhost:3000/api/auth/callback/instagram`
4. Copy App ID and App Secret to `.env.local`

### 5. Start Development Server

```bash
npm run dev
```

### 6. Test the Flow

1. Go to `http://localhost:3000`
2. Click on any social login button
3. Authorize the app
4. You'll be redirected to the dashboard
5. Click "Add Account" to connect additional accounts

## Current Features

✅ OAuth authentication with 5 providers
✅ Multi-account linking (connect multiple platforms)
✅ Account management (view, unlink accounts)
✅ Protected dashboard route
✅ Error handling
✅ Session management

## Not Yet Implemented

⏳ Social media API clients (fetching posts)
⏳ Data sync service (background jobs)
⏳ Analytics dashboard
⏳ Posts feed
⏳ Cron jobs for automatic syncing

## File Structure

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts    # NextAuth handler
│   │       └── unlink-account/route.ts   # Unlink accounts
│   ├── auth/
│   │   └── error/page.tsx                # OAuth error page
│   ├── dashboard/
│   │   └── page.tsx                      # Main dashboard
│   └── page.tsx                          # Login page
├── components/
│   ├── dashboard/
│   │   └── connected-accounts-card.tsx   # Account management UI
│   ├── providers/
│   │   └── session-provider.tsx          # NextAuth session wrapper
│   └── social-login-buttons.tsx          # OAuth buttons
├── lib/
│   ├── auth/
│   │   ├── account-linking.ts            # Account utilities
│   │   └── providers/
│   │       ├── tiktok.ts                 # Custom TikTok OAuth
│   │       └── instagram.ts              # Custom Instagram OAuth
│   ├── auth.ts                           # NextAuth config
│   └── prisma.ts                         # Prisma client
└── prisma/
    └── schema.prisma                     # Database schema
```

## Troubleshooting

### Build Error: "Export GET doesn't exist"
- Already fixed! The route handler properly exports `{ GET, POST }` from handlers.

### Database Connection Error
- Make sure your DATABASE_URL is correct
- Run `npx prisma db push` to create tables
- Check if the database is accessible

### OAuth Callback Error
- Verify callback URLs match exactly in OAuth app settings
- Check that environment variables are set correctly
- Make sure NEXTAUTH_URL is set to `http://localhost:3000`

### "Cannot find module" Error
- Run `npm install` to ensure all dependencies are installed
- Run `npx prisma generate` to regenerate Prisma client

## Next Steps

After testing the OAuth flow, you can:
1. Build the social media API clients to fetch posts
2. Implement the sync service for automatic data fetching
3. Create analytics dashboards
4. Add posts feed with filtering
5. Set up background jobs for periodic syncing
