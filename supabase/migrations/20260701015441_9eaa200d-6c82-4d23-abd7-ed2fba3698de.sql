REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, display_name, age, height, birth_date, birth_place, department, city,
  category, service_type, description, whatsapp, telegram, photos, services,
  rate_short, rate_one_hour, rate_two_hours, rate_full_day,
  is_verified, verification_status, verification_submitted_at,
  created_at, updated_at, user_number, gender, rating_avg, rating_count,
  view_count, last_active_at, account_type, public_photos, exclusive_photos,
  exclusive_videos, weight, hair_color, measurements, work_zone, nickname,
  preferred_language, is_featured, is_suspended, is_public_visible,
  service_mode, hide_whatsapp
) ON public.profiles TO anon, authenticated;

GRANT SELECT ON public.profiles TO service_role;