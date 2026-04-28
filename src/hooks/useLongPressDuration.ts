import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_DURATION = 500;

export const useLongPressDuration = () => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["long-press-duration", user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_DURATION;
      const { data, error } = await supabase
        .from("profiles")
        .select("long_press_duration_ms")
        .eq("user_id", user.id)
        .single();
      if (error || !data) return DEFAULT_DURATION;
      return data.long_press_duration_ms ?? DEFAULT_DURATION;
    },
    enabled: !!user,
  });
  return data ?? DEFAULT_DURATION;
};

export const useUpdateLongPressDuration = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ms: number) => {
      if (!user) throw new Error("Not signed in");
      const clamped = Math.max(300, Math.min(2000, Math.round(ms)));
      const { error } = await supabase
        .from("profiles")
        .update({ long_press_duration_ms: clamped })
        .eq("user_id", user.id);
      if (error) throw error;
      return clamped;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["long-press-duration", user?.id] });
    },
  });
};
