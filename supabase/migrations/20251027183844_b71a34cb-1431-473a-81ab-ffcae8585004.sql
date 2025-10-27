-- Drop the recursive RLS policy that's causing infinite recursion
DROP POLICY IF EXISTS "Verified members can view other verified profiles" ON rei_registry;