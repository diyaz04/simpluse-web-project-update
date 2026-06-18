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
- `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` for project screenshot uploads

Create dashboard admins in Supabase Authentication, then add their user id to the `profiles` table with `role = 'admin'`. The app does not accept shared hardcoded admin passwords unless demo mode is explicitly enabled.

## Reseller And Order Payment Model

Reseller support is role-based:

- `profiles.role = 'admin'` can manage projects, orders, resellers, and commission records.
- `profiles.role = 'reseller'` can access its own reseller row, affiliate orders, projects, and commission records.
- Creating reseller login accounts from the admin dashboard requires `SUPABASE_SERVICE_ROLE_KEY` on the server or Vercel environment. This key must never be exposed as a `VITE_` client variable.

Order/project payment schemes:

- `payment_scheme = 'one_time'`: client pays `deal_price` once. Maintenance after handoff can be recorded separately by admin.
- `payment_scheme = 'per_user_contract'`: monthly value is `price_per_user * user_count`. Minor changes and error handling are represented through `support_scope` and `maintenance_terms`.

Affiliate commission defaults to a percentage such as `10` and is stored as `commission_rate`; the estimated value is stored in `estimated_commission`. Monthly commission/payment history belongs in `commission_records`, while monthly business totals are exposed through the `monthly_finance_reports` Supabase view.

Admin finance reporting is available at `#/dashboard/finance`. Use it to filter monthly reports, approve reseller commissions, mark commissions as paid, or void invalid commission records. Resellers can see their own monthly commission history from `#/reseller`.

One-time project follow-up work can be billed through `maintenance_billings`, also managed from `#/dashboard/finance`. Use it for post-handoff fixes, minor revisions, or maintenance work that is outside the original one-time deal.

## Demo Mode

For local sandbox testing only, set:

```env
VITE_DEMO_MODE="true"
DEMO_MODE="true"
```

Demo mode uses browser localStorage, demo seed projects/orders, and the demo login shown on the login screen. Keep both flags `false` in production.
