-- 1. Add Foreign Key constraint for current_tier_id in profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_membership_tiers 
FOREIGN KEY (current_tier_id) 
REFERENCES public.membership_tiers (id)
ON DELETE SET NULL;

-- 2. Enable RLS on membership_tiers
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;

-- 3. Allow everyone (or at least authenticated users) to read tiers
CREATE POLICY "Tiers are viewable by everyone"
ON public.membership_tiers FOR SELECT
USING (true);
