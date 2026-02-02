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
          .select('display_name, profile_complete')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        // User needs profile setup if no display_name or profile_complete is false
        const profileIncomplete = !profile?.display_name || !profile?.profile_complete;
        setNeedsProfileSetup(profileIncomplete);
        
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
