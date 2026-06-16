# Simpluse

React + Express app for the Simpluse public site, order form, and admin dashboard.

## Run Locally

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and fill the production values below.
3. Run the app:
   `npm run dev`

## Production Configuration

Production mode expects real Supabase auth and data by default:

- `VITE_DEMO_MODE=false`
- `DEMO_MODE=false`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side order inserts, recommended
- `OWNER_EMAIL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` for owner notifications
- `VITE_PUBLIC_CONTACT_EMAIL` if you want a public email link in the footer

Create dashboard admins in Supabase Authentication. The app does not accept shared hardcoded admin passwords unless demo mode is explicitly enabled.

## Demo Mode

For local sandbox testing only, set:

```env
VITE_DEMO_MODE="true"
DEMO_MODE="true"
```

Demo mode uses browser localStorage, demo seed projects/orders, and the demo login shown on the login screen. Keep both flags `false` in production.
