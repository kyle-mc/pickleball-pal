import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGroupContext } from "@/contexts/GroupContext";

/**
 * Hook to check if the placement system is enabled for the current group.
 * When disabled (default), all MMR/rank values are always visible.
 * When enabled, players with < 10 games see "Placing" instead of MMR.
 */
export function usePlacementEnabled() {
  const { currentGroup } = useGroupContext();
  const [placementEnabled, setPlacementEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGroup?.id) {
      setPlacementEnabled(false);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("groups")
        .select("placement_enabled")
        .eq("id", currentGroup.id)
        .single();

      setPlacementEnabled(data?.placement_enabled ?? false);
      setLoading(false);
    };

    fetch();
  }, [currentGroup?.id]);

  return { placementEnabled, loading };
}
