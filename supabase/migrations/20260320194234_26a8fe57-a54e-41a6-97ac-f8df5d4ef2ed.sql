ALTER TABLE games ADD COLUMN played_at timestamptz DEFAULT now();

-- Allow members to update and delete games
CREATE POLICY "Members can update group games"
ON games FOR UPDATE
TO authenticated
USING ((group_id IS NULL) OR is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can delete group games"
ON games FOR DELETE
TO authenticated
USING ((group_id IS NULL) OR is_group_member(auth.uid(), group_id));