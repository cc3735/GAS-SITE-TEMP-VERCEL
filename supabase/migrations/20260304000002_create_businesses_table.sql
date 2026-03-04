-- Businesses table for LegalFlow Businesses page
CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  ein text,
  address text,
  phone text,
  email text,
  state_of_registration text,
  point_of_contact text,
  registered_agent_name text,
  registered_agent_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own businesses
CREATE POLICY "Users can view own businesses"
  ON public.businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses"
  ON public.businesses FOR DELETE
  USING (auth.uid() = user_id);

-- Staff can view all businesses
CREATE POLICY "Staff can view all businesses"
  ON public.businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_gas_staff = true
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_businesses_updated_at();
