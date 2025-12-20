-- Add admin role for the Twitter-authenticated user wayneanthonyd
INSERT INTO public.user_roles (user_id, role) 
VALUES ('a592e595-fade-42eb-a257-041df8e7125a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;