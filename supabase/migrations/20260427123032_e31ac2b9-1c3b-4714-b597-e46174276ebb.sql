
REVOKE ALL ON FUNCTION public.extend_subscription(uuid, public.subscription_tier, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_weekly_top() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.extend_subscription(uuid, public.subscription_tier, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_weekly_top() TO service_role, postgres;
