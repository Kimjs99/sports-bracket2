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
-- Guest access — run this block to enable ?view=<slug> guest URLs
-- ============================================================

-- RPC: returns all tournaments for a given org slug (anonymous-accessible)
CREATE OR REPLACE FUNCTION get_org_tournaments(org_slug text)
RETURNS TABLE (data jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.data
  FROM tournaments t
  JOIN organizations o ON t.org_id = o.id
  WHERE o.slug = org_slug
  ORDER BY t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_org_tournaments TO anon;
GRANT EXECUTE ON FUNCTION get_org_tournaments TO authenticated;

-- ============================================================
-- Verification
-- ============================================================
-- SELECT table_name, policy_name, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('tournaments','organizations');

-- ============================================================
-- Registration code gate (v0.7.3) — 무단 학교/기관 등록 차단
-- 실제 코드 값은 저장소에 커밋하지 말 것 (아래 placeholder를 교체해 실행)
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
-- 정책 없음 → anon/authenticated 직접 접근 불가 (SECURITY DEFINER 함수만 조회)

INSERT INTO app_settings (key, value) VALUES ('registration_code', '<등록코드로_교체>')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE OR REPLACE FUNCTION validate_registration_code(code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM app_settings WHERE key = 'registration_code' AND value = code);
$$;
GRANT EXECUTE ON FUNCTION validate_registration_code TO anon;
GRANT EXECUTE ON FUNCTION validate_registration_code TO authenticated;

CREATE OR REPLACE FUNCTION register_organization(org_name text, org_slug text, code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org organizations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'registration_code' AND value = code) THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;
  INSERT INTO organizations (name, slug, user_id)
  VALUES (org_name, org_slug, auth.uid())
  RETURNING * INTO new_org;
  RETURN row_to_json(new_org);
END;
$$;
GRANT EXECUTE ON FUNCTION register_organization TO authenticated;

-- 클라이언트 직접 INSERT 봉쇄 — 등록은 RPC로만 가능
DROP POLICY IF EXISTS "orgs_owner_insert" ON organizations;

-- 등록 코드 변경:
-- UPDATE app_settings SET value = '<새코드>' WHERE key = 'registration_code';
