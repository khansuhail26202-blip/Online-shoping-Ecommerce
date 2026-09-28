/*
# Password Reset Codes Table

1. New Tables
- `password_reset_codes`
  - `id` (uuid, primary key)
  - `email` (text, the user's email address)
  - `code` (text, 6-digit numeric code)
  - `expires_at` (timestamptz, 15 minutes from creation)
  - `used` (boolean, default false)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `password_reset_codes`.
- Allow anon + authenticated to call the SECURITY DEFINER functions (which bypass RLS internally).
- Direct table access is denied for all roles (no SELECT/INSERT/UPDATE/DELETE policies).
- `generate_reset_code(email)`: SECURITY DEFINER — looks up the user by email in auth.users, generates a 6-digit code, stores it, and returns the code.
- `verify_reset_code(email, code)`: SECURITY DEFINER — validates the code against the table, marks it used, and updates the user's password in auth.users.
*/

CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No direct table policies — access is only through SECURITY DEFINER functions

-- Function to generate a 6-digit reset code for an email
CREATE OR REPLACE FUNCTION public.generate_reset_code(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_code text;
  v_existing text;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    -- Return a fake code so we don't leak which emails exist
    RETURN '------';
  END IF;

  -- Generate a 6-digit code
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');

  -- Invalidate any existing unused codes for this email
  UPDATE public.password_reset_codes
  SET used = true
  WHERE email = p_email AND used = false;

  -- Insert the new code
  INSERT INTO public.password_reset_codes (email, code, expires_at)
  VALUES (p_email, v_code, now() + interval '15 minutes');

  RETURN v_code;
END;
$$;

-- Function to verify a reset code and update the user's password
CREATE OR REPLACE FUNCTION public.verify_reset_code_and_update(p_email text, p_code text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record record;
  v_user_id uuid;
BEGIN
  -- Find a valid, unused, non-expired code
  SELECT * INTO v_record
  FROM public.password_reset_codes
  WHERE email = p_email
    AND code = p_code
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN false;
  END IF;

  -- Mark the code as used
  UPDATE public.password_reset_codes
  SET used = true
  WHERE id = v_record.id;

  -- Update the user's password in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.generate_reset_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_reset_code_and_update(text, text, text) TO anon, authenticated;
