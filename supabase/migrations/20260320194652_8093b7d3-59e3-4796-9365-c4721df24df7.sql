CREATE POLICY "Admin can delete season stats"
ON player_season_stats FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));