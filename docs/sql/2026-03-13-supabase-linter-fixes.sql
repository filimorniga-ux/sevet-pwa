-- SEVET - Supabase linter fixes
-- Run in Supabase SQL Editor (project: zyvwcxsqdbegzjlmgtou)
-- Safe to run multiple times.

BEGIN;

-- 1) SECURITY: function_search_path_mutable
-- Harden all overloads of public.handle_new_user by fixing search_path.
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'handle_new_user'
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, auth, extensions',
      fn
    );
  END LOOP;
END $$;

-- 2) PERFORMANCE: auth_rls_initplan
-- Replace auth.* calls inside policies with initPlan-friendly wrappers.
-- Example: auth.uid() -> (select auth.uid())
DO $$
DECLARE
  rec record;
  qual_new text;
  check_new text;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    qual_new := rec.qual;
    check_new := rec.with_check;

    IF qual_new IS NOT NULL THEN
      qual_new := replace(qual_new, '(select auth.uid())', '__AUTH_UID__');
      qual_new := replace(qual_new, '(select auth.role())', '__AUTH_ROLE__');
      qual_new := replace(qual_new, '(select auth.jwt())', '__AUTH_JWT__');
      qual_new := replace(qual_new, 'auth.uid()', '(select auth.uid())');
      qual_new := replace(qual_new, 'auth.role()', '(select auth.role())');
      qual_new := replace(qual_new, 'auth.jwt()', '(select auth.jwt())');
      qual_new := replace(qual_new, '__AUTH_UID__', '(select auth.uid())');
      qual_new := replace(qual_new, '__AUTH_ROLE__', '(select auth.role())');
      qual_new := replace(qual_new, '__AUTH_JWT__', '(select auth.jwt())');
    END IF;

    IF check_new IS NOT NULL THEN
      check_new := replace(check_new, '(select auth.uid())', '__AUTH_UID__');
      check_new := replace(check_new, '(select auth.role())', '__AUTH_ROLE__');
      check_new := replace(check_new, '(select auth.jwt())', '__AUTH_JWT__');
      check_new := replace(check_new, 'auth.uid()', '(select auth.uid())');
      check_new := replace(check_new, 'auth.role()', '(select auth.role())');
      check_new := replace(check_new, 'auth.jwt()', '(select auth.jwt())');
      check_new := replace(check_new, '__AUTH_UID__', '(select auth.uid())');
      check_new := replace(check_new, '__AUTH_ROLE__', '(select auth.role())');
      check_new := replace(check_new, '__AUTH_JWT__', '(select auth.jwt())');
    END IF;

    IF qual_new IS DISTINCT FROM rec.qual THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        rec.policyname,
        rec.schemaname,
        rec.tablename,
        qual_new
      );
    END IF;

    IF check_new IS DISTINCT FROM rec.with_check THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        rec.policyname,
        rec.schemaname,
        rec.tablename,
        check_new
      );
    END IF;
  END LOOP;
END $$;

-- 3) PERFORMANCE: multiple_permissive_policies
-- Consolidate duplicate PERMISSIVE policies for same table/cmd/roles into one
-- equivalent policy (OR semantics), then drop the old duplicates.
DO $$
DECLARE
  grp record;
  pol record;
  merged_qual text;
  merged_check text;
  merged_name text;
  roles_sql text;
  create_sql text;
BEGIN
  FOR grp IN
    SELECT schemaname, tablename, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
    GROUP BY schemaname, tablename, cmd, roles
    HAVING count(*) > 1
  LOOP
    merged_qual := NULL;
    merged_check := NULL;

    FOR pol IN
      SELECT policyname, qual, with_check
      FROM pg_policies
      WHERE schemaname = grp.schemaname
        AND tablename = grp.tablename
        AND cmd = grp.cmd
        AND roles = grp.roles
        AND permissive = 'PERMISSIVE'
      ORDER BY policyname
    LOOP
      IF pol.qual IS NOT NULL THEN
        merged_qual := CASE
          WHEN merged_qual IS NULL THEN '(' || pol.qual || ')'
          ELSE merged_qual || ' OR (' || pol.qual || ')'
        END;
      END IF;

      IF pol.with_check IS NOT NULL THEN
        merged_check := CASE
          WHEN merged_check IS NULL THEN '(' || pol.with_check || ')'
          ELSE merged_check || ' OR (' || pol.with_check || ')'
        END;
      END IF;
    END LOOP;

    SELECT string_agg(format('%I', r), ', ')
    INTO roles_sql
    FROM unnest(grp.roles) AS r;

    merged_name := 'merged_' || lower(grp.cmd) || '_' || grp.tablename || '_' ||
                   substr(md5(grp.schemaname || '.' || grp.tablename || '|' || grp.cmd || '|' || array_to_string(grp.roles, ',')), 1, 8);

    create_sql := format(
      'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR %s TO %s',
      merged_name,
      grp.schemaname,
      grp.tablename,
      grp.cmd,
      roles_sql
    );

    IF merged_qual IS NOT NULL THEN
      create_sql := create_sql || format(' USING (%s)', merged_qual);
    END IF;

    IF merged_check IS NOT NULL THEN
      create_sql := create_sql || format(' WITH CHECK (%s)', merged_check);
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', merged_name, grp.schemaname, grp.tablename);
    EXECUTE create_sql;

    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = grp.schemaname
        AND tablename = grp.tablename
        AND cmd = grp.cmd
        AND roles = grp.roles
        AND permissive = 'PERMISSIVE'
        AND policyname <> merged_name
    LOOP
      EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, grp.schemaname, grp.tablename);
    END LOOP;
  END LOOP;
END $$;

COMMIT;
