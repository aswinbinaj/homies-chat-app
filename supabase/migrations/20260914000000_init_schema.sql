-- ==============================================================================
-- Supabase Schema Migration: Private Real-Time Chat App
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- PROFILES TABLE
-- Linked directly to auth.users. Passwords remain securely inside auth.users.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT username_min_length CHECK (char_length(trim(username)) >= 3),
    CONSTRAINT username_max_length CHECK (char_length(username) <= 30)
);

-- INVITES TABLE
-- Invite-only registration mechanism.
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RATE LIMIT / ATTEMPTS LOG TABLE FOR INVITES
-- Protects against brute-forcing invite codes.
CREATE TABLE IF NOT EXISTS public.invite_check_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_or_session TEXT NOT NULL,
    attempt_count INT NOT NULL DEFAULT 1
);

-- MESSAGES TABLE
-- Core 1-hour ephemeral chat messages.
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '1 hour'),
    CONSTRAINT message_not_empty CHECK (char_length(trim(message)) > 0),
    CONSTRAINT message_max_length CHECK (char_length(message) <= 1000)
);

-- 3. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_messages_active ON public.messages (expires_at, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites (code);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON public.invites (expires_at);
CREATE INDEX IF NOT EXISTS idx_invite_check_attempts_time ON public.invite_check_attempts (attempted_at);

-- Relationships between public tables for PostgREST automatic resource embedding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_profiles'
    ) THEN
        ALTER TABLE public.messages
            ADD CONSTRAINT fk_messages_profiles
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_invites_profiles'
    ) THEN
        ALTER TABLE public.invites
            ADD CONSTRAINT fk_invites_profiles
            FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_check_attempts ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Authenticated users can view profiles of group members
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update only their own profile, but CANNOT elevate is_admin or modify id/created_at
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND is_admin = (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
        AND is_disabled = (SELECT p.is_disabled FROM public.profiles p WHERE p.id = auth.uid())
    );

-- Admins can update any profile (e.g., disable user or toggle admin)
CREATE POLICY "Admins can update profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- MESSAGES POLICIES
-- Authenticated users can only read messages that have NOT expired
CREATE POLICY "Users can read non-expired messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (expires_at > NOW());

-- Authenticated users can insert messages strictly as themselves with 1-hour expiration
CREATE POLICY "Users can insert messages as themselves"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND char_length(trim(message)) > 0
        AND char_length(message) <= 1000
        AND expires_at > created_at
        AND NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_disabled = TRUE
        )
    );

-- Normal users CANNOT update or delete messages.
-- Admins can delete messages manually if needed.
CREATE POLICY "Admins can delete messages"
    ON public.messages FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- INVITES POLICIES
-- Normal users cannot read or modify the invites table directly.
-- Only authenticated admins can manage invites.
CREATE POLICY "Admins can view invites"
    ON public.invites FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can insert invites"
    ON public.invites FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can update invites"
    ON public.invites FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can delete invites"
    ON public.invites FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- 5. SECURE DATABASE FUNCTIONS (SECURITY DEFINER)

-- Function: Validate invite code (Rate-limited, safe for frontend pre-validation)
CREATE OR REPLACE FUNCTION public.check_invite_valid(code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite RECORD;
    v_clean_code TEXT;
BEGIN
    IF code_input IS NULL OR trim(code_input) = '' THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Invite code cannot be empty');
    END IF;

    v_clean_code := upper(trim(code_input));

    SELECT * INTO v_invite
    FROM public.invites
    WHERE upper(code) = v_clean_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Invalid invite code');
    END IF;

    IF v_invite.used THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'This invite code has already been used');
    END IF;

    IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= NOW() THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'This invite code has expired');
    END IF;

    RETURN jsonb_build_object('valid', true, 'reason', 'Valid invite code');
END;
$$;

-- Function: Admin helper to create new invites
CREATE OR REPLACE FUNCTION public.create_invite(code_input TEXT, expires_in_days INT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_code TEXT;
    v_expires_at TIMESTAMPTZ := NULL;
    v_new_id UUID;
BEGIN
    -- Ensure caller is authenticated admin
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Access denied. Only administrators can create invites.';
    END IF;

    IF code_input IS NULL OR trim(code_input) = '' THEN
        -- Auto-generate randomized 8-char code
        v_code := upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
    ELSE
        v_code := upper(trim(code_input));
    END IF;

    IF expires_in_days IS NOT NULL AND expires_in_days > 0 THEN
        v_expires_at := NOW() + (expires_in_days || ' days')::interval;
    END IF;

    INSERT INTO public.invites (code, created_by, expires_at)
    VALUES (v_code, auth.uid(), v_expires_at)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'id', v_new_id, 'code', v_code, 'expires_at', v_expires_at);
END;
$$;

-- Function: Admin helper to revoke invites
CREATE OR REPLACE FUNCTION public.revoke_invite(invite_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Access denied. Only administrators can revoke invites.';
    END IF;

    UPDATE public.invites
    SET expires_at = NOW()
    WHERE id = invite_id AND used = FALSE;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Function: Cleanup expired messages (Physical deletion)
CREATE OR REPLACE FUNCTION public.cleanup_expired_messages()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM public.messages
    WHERE expires_at <= NOW();

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- 6. USER REGISTRATION TRIGGER (ATOMIC INVITE CONSUMPTION & PROFILE CREATION)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite_code TEXT;
    v_username TEXT;
    v_clean_code TEXT;
    v_invite RECORD;
    v_user_count INT;
    v_is_admin BOOLEAN := FALSE;
BEGIN
    -- Extract metadata supplied at registration
    v_invite_code := NEW.raw_user_meta_data->>'invite_code';
    v_username := trim(COALESCE(NEW.raw_user_meta_data->>'username', ''));

    -- Validate username
    IF v_username = '' OR char_length(v_username) < 3 OR char_length(v_username) > 30 THEN
        RAISE EXCEPTION 'Username must be between 3 and 30 characters.';
    END IF;

    -- Check if this is the very first user in the database
    SELECT count(*) INTO v_user_count FROM public.profiles;

    -- If this is the first registered user, make them the initial admin!
    IF v_user_count = 0 THEN
        v_is_admin := TRUE;
    END IF;

    -- Invite Code Validation
    IF v_invite_code IS NULL OR trim(v_invite_code) = '' THEN
        RAISE EXCEPTION 'An invite code is required to register.';
    END IF;

    v_clean_code := upper(trim(v_invite_code));

    -- Lock the invite row for update to prevent race conditions
    SELECT * INTO v_invite
    FROM public.invites
    WHERE upper(code) = v_clean_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The invite code "%" is invalid.', v_clean_code;
    END IF;

    IF v_invite.used THEN
        RAISE EXCEPTION 'The invite code "%" has already been used.', v_clean_code;
    END IF;

    IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= NOW() THEN
        RAISE EXCEPTION 'The invite code "%" has expired.', v_clean_code;
    END IF;

    -- Mark invite as used and bind to this user
    UPDATE public.invites
    SET used = TRUE,
        used_by = NEW.id
    WHERE id = v_invite.id;

    -- Create corresponding profile
    INSERT INTO public.profiles (
        id,
        username,
        avatar_url,
        is_admin,
        is_disabled,
        created_at,
        last_seen
    ) VALUES (
        NEW.id,
        v_username,
        NEW.raw_user_meta_data->>'avatar_url',
        v_is_admin,
        FALSE,
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ENABLE REALTIME ON MESSAGES TABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- 8. SEED INITIAL BOOTSTRAP INVITE CODE
-- This initial invite code allows the first admin or user to register immediately.
INSERT INTO public.invites (code, created_at, expires_at, used)
VALUES ('WELCOME-FRIENDS-2026', NOW(), NULL, FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.invites (code, created_at, expires_at, used)
VALUES ('VIP-GROUP-CHAT', NOW(), NULL, FALSE)
ON CONFLICT (code) DO NOTHING;

-- 9. PERMISSIONS AND GRANTS
-- Grant schema usage to public API roles (anon, authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_invite_valid(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_invite(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_messages() TO authenticated, service_role;

-- 10. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 11. OPTIONAL: PG_CRON SCHEDULED CLEANUP JOB
-- (Works on Supabase projects where pg_cron extension is enabled)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule cleanup to run every 5 minutes
        PERFORM cron.schedule(
            'cleanup-expired-messages',
            '*/5 * * * *',
            'SELECT public.cleanup_expired_messages();'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If pg_cron cannot be accessed directly, edge function or external cron can be used
        NULL;
END $$;

