-- Simpluse full Supabase schema migration.
-- Safe to run more than once from Supabase SQL Editor.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. App user roles.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  whatsapp TEXT,
  role TEXT DEFAULT 'reseller' NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'reseller' NOT NULL;

UPDATE public.profiles SET role = 'reseller' WHERE role IS NULL;
UPDATE public.profiles SET full_name = 'User' WHERE full_name IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'reseller')) NOT VALID;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- 2. Reseller data.
CREATE TABLE IF NOT EXISTS public.resellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  commission_rate NUMERIC DEFAULT 10 NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  notes TEXT
);

ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10 NOT NULL;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.resellers SET commission_rate = 10 WHERE commission_rate IS NULL;
UPDATE public.resellers SET status = 'active' WHERE status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resellers_status_check'
      AND conrelid = 'public.resellers'::regclass
  ) THEN
    ALTER TABLE public.resellers
      ADD CONSTRAINT resellers_status_check CHECK (status IN ('active', 'inactive')) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resellers_user_id_key'
      AND conrelid = 'public.resellers'::regclass
  ) THEN
    ALTER TABLE public.resellers
      ADD CONSTRAINT resellers_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Skipped resellers_user_id_key because duplicate user_id values exist.';
END $$;

CREATE OR REPLACE FUNCTION public.current_reseller_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.resellers WHERE user_id = auth.uid() LIMIT 1
$$;

-- 3. Projects.
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_name TEXT NOT NULL,
  client_wa TEXT,
  client_email TEXT,
  project_name TEXT NOT NULL,
  website_category TEXT,
  internal_notes TEXT,
  status TEXT DEFAULT 'ongoing' NOT NULL,
  start_date DATE,
  deadline DATE,
  total_price NUMERIC DEFAULT 0,
  dp_paid NUMERIC DEFAULT 0,
  source_order_id UUID,
  source_channel TEXT DEFAULT 'direct' NOT NULL,
  reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL,
  reseller_name TEXT,
  payment_scheme TEXT DEFAULT 'one_time' NOT NULL,
  deal_price NUMERIC DEFAULT 0,
  price_per_user NUMERIC DEFAULT 0,
  user_count INTEGER DEFAULT 0,
  monthly_amount NUMERIC DEFAULT 0,
  support_scope TEXT,
  maintenance_terms TEXT,
  commission_rate NUMERIC DEFAULT 0,
  estimated_commission NUMERIC DEFAULT 0,
  commission_status TEXT DEFAULT 'pending' NOT NULL,
  tech_stack JSONB DEFAULT '[]'::jsonb NOT NULL,
  is_public BOOLEAN DEFAULT false NOT NULL,
  public_name TEXT,
  screenshot_url TEXT,
  screenshot_gallery JSONB DEFAULT '[]'::jsonb NOT NULL,
  live_url TEXT,
  description TEXT
);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_wa TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS website_category TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ongoing' NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS dp_paid NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_order_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_channel TEXT DEFAULT 'direct' NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reseller_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS payment_scheme TEXT DEFAULT 'one_time' NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deal_price NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS price_per_user NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_count INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS support_scope TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS maintenance_terms TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS estimated_commission NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'pending' NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS public_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS screenshot_gallery JSONB DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE public.projects SET status = 'ongoing' WHERE status IS NULL;
UPDATE public.projects SET total_price = 0 WHERE total_price IS NULL;
UPDATE public.projects SET dp_paid = 0 WHERE dp_paid IS NULL;
UPDATE public.projects SET source_channel = 'direct' WHERE source_channel IS NULL;
UPDATE public.projects SET payment_scheme = 'one_time' WHERE payment_scheme IS NULL;
UPDATE public.projects SET deal_price = 0 WHERE deal_price IS NULL;
UPDATE public.projects SET price_per_user = 0 WHERE price_per_user IS NULL;
UPDATE public.projects SET user_count = 0 WHERE user_count IS NULL;
UPDATE public.projects SET monthly_amount = 0 WHERE monthly_amount IS NULL;
UPDATE public.projects SET commission_rate = 0 WHERE commission_rate IS NULL;
UPDATE public.projects SET estimated_commission = 0 WHERE estimated_commission IS NULL;
UPDATE public.projects SET commission_status = 'pending' WHERE commission_status IS NULL;
UPDATE public.projects SET tech_stack = '[]'::jsonb WHERE tech_stack IS NULL;
UPDATE public.projects SET is_public = false WHERE is_public IS NULL;
UPDATE public.projects SET screenshot_gallery = '[]'::jsonb WHERE screenshot_gallery IS NULL;

-- 4. Orders / leads.
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  website_type TEXT,
  description TEXT,
  budget TEXT,
  deadline TEXT,
  status TEXT DEFAULT 'new' NOT NULL,
  source_channel TEXT DEFAULT 'direct' NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL,
  reseller_name TEXT,
  payment_scheme TEXT DEFAULT 'one_time' NOT NULL,
  deal_price NUMERIC DEFAULT 0,
  price_per_user NUMERIC DEFAULT 0,
  user_count INTEGER DEFAULT 0,
  monthly_amount NUMERIC DEFAULT 0,
  support_scope TEXT,
  maintenance_terms TEXT,
  commission_rate NUMERIC DEFAULT 0,
  estimated_commission NUMERIC DEFAULT 0
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS website_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS budget TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deadline TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source_channel TEXT DEFAULT 'direct' NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_scheme TEXT DEFAULT 'one_time' NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deal_price NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price_per_user NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_count INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS support_scope TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS maintenance_terms TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_commission NUMERIC DEFAULT 0;

UPDATE public.orders SET status = 'new' WHERE status IS NULL;
UPDATE public.orders SET source_channel = 'direct' WHERE source_channel IS NULL;
UPDATE public.orders SET payment_scheme = 'one_time' WHERE payment_scheme IS NULL;
UPDATE public.orders SET deal_price = 0 WHERE deal_price IS NULL;
UPDATE public.orders SET price_per_user = 0 WHERE price_per_user IS NULL;
UPDATE public.orders SET user_count = 0 WHERE user_count IS NULL;
UPDATE public.orders SET monthly_amount = 0 WHERE monthly_amount IS NULL;
UPDATE public.orders SET commission_rate = 0 WHERE commission_rate IS NULL;
UPDATE public.orders SET estimated_commission = 0 WHERE estimated_commission IS NULL;

-- 5. Commission and maintenance finance.
CREATE TABLE IF NOT EXISTS public.commission_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  reseller_name TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  period_month DATE NOT NULL,
  base_amount NUMERIC DEFAULT 0 NOT NULL,
  commission_rate NUMERIC DEFAULT 0 NOT NULL,
  commission_amount NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  paid_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id) ON DELETE CASCADE;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS reseller_name TEXT;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS period_month DATE;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS base_amount NUMERIC DEFAULT 0 NOT NULL;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0 NOT NULL;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0 NOT NULL;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' NOT NULL;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.commission_records ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.commission_records SET period_month = date_trunc('month', COALESCE(created_at, now()))::date WHERE period_month IS NULL;
UPDATE public.commission_records SET base_amount = 0 WHERE base_amount IS NULL;
UPDATE public.commission_records SET commission_rate = 0 WHERE commission_rate IS NULL;
UPDATE public.commission_records SET commission_amount = 0 WHERE commission_amount IS NULL;
UPDATE public.commission_records SET status = 'pending' WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS public.maintenance_billings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name TEXT,
  client_name TEXT,
  billing_date DATE DEFAULT CURRENT_DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  paid_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS billing_date DATE DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0 NOT NULL;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' NOT NULL;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.maintenance_billings ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.maintenance_billings SET billing_date = CURRENT_DATE WHERE billing_date IS NULL;
UPDATE public.maintenance_billings SET amount = 0 WHERE amount IS NULL;
UPDATE public.maintenance_billings SET status = 'draft' WHERE status IS NULL;

-- 6. Checks added idempotently. NOT VALID keeps old inconsistent rows from blocking the migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_source_channel_check' AND conrelid = 'public.projects'::regclass) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_source_channel_check CHECK (source_channel IN ('direct', 'reseller')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_payment_scheme_check' AND conrelid = 'public.projects'::regclass) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_payment_scheme_check CHECK (payment_scheme IN ('one_time', 'per_user_contract')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_commission_status_check' AND conrelid = 'public.projects'::regclass) THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_commission_status_check CHECK (commission_status IN ('pending', 'approved', 'paid', 'void')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check' AND conrelid = 'public.orders'::regclass) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('new', 'contacted', 'deal', 'rejected')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_source_channel_check' AND conrelid = 'public.orders'::regclass) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_source_channel_check CHECK (source_channel IN ('direct', 'reseller')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_scheme_check' AND conrelid = 'public.orders'::regclass) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_payment_scheme_check CHECK (payment_scheme IN ('one_time', 'per_user_contract')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commission_records_status_check' AND conrelid = 'public.commission_records'::regclass) THEN
    ALTER TABLE public.commission_records ADD CONSTRAINT commission_records_status_check CHECK (status IN ('pending', 'approved', 'paid', 'void')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_billings_status_check' AND conrelid = 'public.maintenance_billings'::regclass) THEN
    ALTER TABLE public.maintenance_billings ADD CONSTRAINT maintenance_billings_status_check CHECK (status IN ('draft', 'issued', 'paid', 'void')) NOT VALID;
  END IF;
END $$;

-- 7. Reporting view.
CREATE OR REPLACE VIEW public.monthly_finance_reports
WITH (security_invoker = true)
AS
WITH project_months AS (
  SELECT
    date_trunc('month', p.created_at)::date AS report_month,
    COUNT(*) AS project_count,
    COALESCE(SUM(p.total_price), 0) AS total_project_value,
    COALESCE(SUM(p.dp_paid), 0) AS total_dp_paid,
    COALESCE(SUM(p.total_price - p.dp_paid), 0) AS outstanding_balance,
    COALESCE(SUM(CASE WHEN p.payment_scheme = 'per_user_contract' THEN p.monthly_amount ELSE 0 END), 0) AS recurring_monthly_value,
    COALESCE(SUM(p.estimated_commission), 0) AS estimated_commission
  FROM public.projects p
  GROUP BY date_trunc('month', p.created_at)::date
),
maintenance_months AS (
  SELECT
    date_trunc('month', m.billing_date)::date AS report_month,
    COALESCE(SUM(CASE WHEN m.status IN ('issued', 'paid') THEN m.amount ELSE 0 END), 0) AS maintenance_issued_value,
    COALESCE(SUM(CASE WHEN m.status = 'paid' THEN m.amount ELSE 0 END), 0) AS maintenance_paid_value
  FROM public.maintenance_billings m
  GROUP BY date_trunc('month', m.billing_date)::date
)
SELECT
  COALESCE(p.report_month, m.report_month) AS report_month,
  COALESCE(p.project_count, 0) AS project_count,
  COALESCE(p.total_project_value, 0) AS total_project_value,
  COALESCE(p.total_dp_paid, 0) AS total_dp_paid,
  COALESCE(p.outstanding_balance, 0) AS outstanding_balance,
  COALESCE(p.recurring_monthly_value, 0) AS recurring_monthly_value,
  COALESCE(p.estimated_commission, 0) AS estimated_commission,
  COALESCE(m.maintenance_issued_value, 0) AS maintenance_issued_value,
  COALESCE(m.maintenance_paid_value, 0) AS maintenance_paid_value
FROM project_months p
FULL JOIN maintenance_months m ON m.report_month = p.report_month;

-- 8. Indexes for dashboard/reseller queries.
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_resellers_user_id ON public.resellers(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_public ON public.projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_reseller_id ON public.projects(reseller_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_reseller_id ON public.orders(reseller_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_reseller_id ON public.commission_records(reseller_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_period_month ON public.commission_records(period_month DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_billings_project_id ON public.maintenance_billings(project_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_billings_billing_date ON public.maintenance_billings(billing_date DESC);

-- 9. RLS and policies. Policies are dropped/recreated so definitions stay current and never duplicate.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_billings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage resellers" ON public.resellers;
DROP POLICY IF EXISTS "Resellers can read own reseller row" ON public.resellers;
DROP POLICY IF EXISTS "Public projects are readable" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Resellers can read own projects" ON public.projects;
DROP POLICY IF EXISTS "Public visitors can submit direct orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Resellers can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Resellers can submit own orders" ON public.orders;
DROP POLICY IF EXISTS "Resellers can update own active orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage commission records" ON public.commission_records;
DROP POLICY IF EXISTS "Resellers can read own commission records" ON public.commission_records;
DROP POLICY IF EXISTS "Admins can manage maintenance billings" ON public.maintenance_billings;

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admins can manage resellers"
ON public.resellers FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Resellers can read own reseller row"
ON public.resellers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Public projects are readable"
ON public.projects FOR SELECT
USING (is_public = true OR public.current_user_role() = 'admin');

CREATE POLICY "Admins can manage projects"
ON public.projects FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Resellers can read own projects"
ON public.projects FOR SELECT TO authenticated
USING (reseller_id = public.current_reseller_id());

CREATE POLICY "Public visitors can submit direct orders"
ON public.orders FOR INSERT TO anon
WITH CHECK (
  COALESCE(source_channel, 'direct') = 'direct'
  AND reseller_id IS NULL
  AND submitted_by IS NULL
);

CREATE POLICY "Admins can manage orders"
ON public.orders FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Resellers can read own orders"
ON public.orders FOR SELECT TO authenticated
USING (reseller_id = public.current_reseller_id());

CREATE POLICY "Resellers can submit own orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() = 'reseller'
  AND reseller_id = public.current_reseller_id()
  AND source_channel = 'reseller'
);

CREATE POLICY "Resellers can update own active orders"
ON public.orders FOR UPDATE TO authenticated
USING (
  reseller_id = public.current_reseller_id()
  AND status IN ('new', 'contacted')
)
WITH CHECK (
  reseller_id = public.current_reseller_id()
  AND source_channel = 'reseller'
);

CREATE POLICY "Admins can manage commission records"
ON public.commission_records FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Resellers can read own commission records"
ON public.commission_records FOR SELECT TO authenticated
USING (reseller_id = public.current_reseller_id());

CREATE POLICY "Admins can manage maintenance billings"
ON public.maintenance_billings FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

COMMIT;

-- Create your first admin after the matching auth user exists:
-- INSERT INTO public.profiles (id, full_name, role)
-- VALUES ('UUID_AUTH_USER_ADMIN_ANDA', 'Admin Simpluse', 'admin')
-- ON CONFLICT (id) DO UPDATE
-- SET role = 'admin',
--     full_name = EXCLUDED.full_name,
--     updated_at = timezone('utc'::text, now());
