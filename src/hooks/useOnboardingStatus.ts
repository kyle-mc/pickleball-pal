import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStatus {
  loading: boolean;
  needsProfileSetup: boolean;
  needsGroupOnboarding: boolean;
  isFullyOnboarded: boolean;
}

export const useOnboardingStatus = (): OnboardingStatus => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        setNeedsProfileSetup(false);
        return;
      }

      try {
        // Check profile completion
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, profile_complete, linked_player_id')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        // A user only truly needs profile setup if they have NEITHER a linked player NOR a display name.
        // Once either is set, they're considered onboarded — don't show the setup screen on every app return.
        const hasIdentity = !!profile?.linked_player_id || !!profile?.display_name;
        setNeedsProfileSetup(!hasIdentity);
        
        // No group onboarding check - everyone is auto-joined to KC Pickleballers
      } catch (error) {
        console.error('Onboarding check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading]);

  return {
    loading: loading || authLoading,
    needsProfileSetup,
    needsGroupOnboarding: false, // Always false - bypassed
    isFullyOnboarded: !needsProfileSetup,
  };
};
