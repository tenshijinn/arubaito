-- Storage bucket RLS policies for cv-uploads
-- Users can only access their own files (folder pattern: {user_id}/*)

-- Policy: Users can view their own CV files
CREATE POLICY "Users can view own cv files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can upload their own CV files  
CREATE POLICY "Users can upload own cv files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cv-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own CV files
CREATE POLICY "Users can update own cv files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cv-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own CV files
CREATE POLICY "Users can delete own cv files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cv-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage bucket RLS policies for rei-contributor-files
-- Users can only access their own files (folder pattern: {wallet_address}/*)

-- Policy: Users can view their own contributor files
CREATE POLICY "Users can view own contributor files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'rei-contributor-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR (current_setting('request.jwt.claims', true)::json ->> 'wallet_address') = (storage.foldername(name))[1]
  )
);

-- Policy: Users can upload their own contributor files
CREATE POLICY "Users can upload own contributor files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'rei-contributor-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR (current_setting('request.jwt.claims', true)::json ->> 'wallet_address') = (storage.foldername(name))[1]
  )
);

-- Policy: Users can update their own contributor files
CREATE POLICY "Users can update own contributor files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'rei-contributor-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR (current_setting('request.jwt.claims', true)::json ->> 'wallet_address') = (storage.foldername(name))[1]
  )
);

-- Policy: Users can delete their own contributor files
CREATE POLICY "Users can delete own contributor files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'rei-contributor-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR (current_setting('request.jwt.claims', true)::json ->> 'wallet_address') = (storage.foldername(name))[1]
  )
);

-- Service role can manage all storage objects (for edge functions)
CREATE POLICY "Service role can manage all storage"
ON storage.objects
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role');
