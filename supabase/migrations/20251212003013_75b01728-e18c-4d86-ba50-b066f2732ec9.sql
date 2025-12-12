-- Add DELETE policy for cv_analyses table
CREATE POLICY "Users can delete their own analyses"
ON cv_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for cv_portfolio_images (cascade with analysis)
CREATE POLICY "Users can delete portfolio images when deleting analysis"
ON cv_portfolio_images FOR DELETE
USING (auth.uid() = user_id);