CREATE OR REPLACE FUNCTION public.increment_user_points(
  p_wallet_address text, 
  p_points integer, 
  p_x_user_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO user_points (wallet_address, total_points, x_user_id)
  VALUES (p_wallet_address, p_points, p_x_user_id)
  ON CONFLICT (wallet_address) DO UPDATE
  SET total_points = user_points.total_points + p_points,
      x_user_id = COALESCE(EXCLUDED.x_user_id, user_points.x_user_id),
      updated_at = now();
END;
$$;