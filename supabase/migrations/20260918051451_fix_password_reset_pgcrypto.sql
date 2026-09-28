/*
# Fix password reset: use auth.users encrypted_password update via crypt

1. Changes
- Enable pgcrypto extension (provides gen_salt and crypt functions).
- Recreate verify_reset_code_and_update to use crypt() for password hashing.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS public.verify_reset_code_and_update(text, text, text);

CREATE OR REPLACE FUNCTION public.verify_reset_code_and_update(p_email text, p_code text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_record record;
  v_user_id uuid;
BEGIN
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

  UPDATE public.password_reset_codes
  SET used = true
  WHERE id = v_record.id;

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

GRANT EXECUTE ON FUNCTION public.verify_reset_code_and_update(text, text, text) TO anon, authenticated;
