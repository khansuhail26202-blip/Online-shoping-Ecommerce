/*
# Fix: pgcrypto lives in "extensions" schema, not "public"
# gen_salt and crypt are unavailable without schema-qualifying them.
# Recreate the verify function with explicit schema references.
*/

DROP FUNCTION IF EXISTS public.verify_reset_code_and_update(text, text, text);

CREATE OR REPLACE FUNCTION public.verify_reset_code_and_update(p_email text, p_code text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
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
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_reset_code_and_update(text, text, text) TO anon, authenticated;
