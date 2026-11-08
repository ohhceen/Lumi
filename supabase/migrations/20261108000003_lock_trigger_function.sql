-- handle_new_user() is only meant to run as the auth.users trigger.
-- Remove it from the public API (Supabase security advisor 0028/0029).
-- The trigger keeps working: trigger functions don't need EXECUTE for the
-- role that fires them.
revoke all on function public.handle_new_user() from public, anon, authenticated;
