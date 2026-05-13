-- ============================================================
-- Multi-tenant migration — run in Supabase SQL Editor
-- ============================================================

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Organizations: anyone can read (for org picker), owner can write
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_public_read"
  ON organizations FOR SELECT USING (true);

CREATE POLICY "orgs_owner_insert"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orgs_owner_update"
  ON organizations FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Add columns to tournaments table
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS org_id     UUID REFERENCES organizations(id);

-- 3. Drop the old public SELECT policy (adjust name if different)
-- Find existing policies: SELECT * FROM pg_policies WHERE tablename = 'tournaments';
DROP POLICY IF EXISTS "Enable read access for all users" ON tournaments;
DROP POLICY IF EXISTS "anon_read" ON tournaments;
DROP POLICY IF EXISTS "public_read" ON tournaments;

-- 4. New RLS policies — authenticated users see only their own tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_owner_select"
  ON tournaments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tournaments_owner_insert"
  ON tournaments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tournaments_owner_update"
  ON tournaments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "tournaments_owner_delete"
  ON tournaments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Verification
-- ============================================================
-- SELECT table_name, policy_name, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('tournaments','organizations');
