import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Ban, CheckCircle, UserX, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  isBlacklisted: boolean;
  requiresVerification: boolean;
  displayName: string;
  onChanged: () => void;
}

export function AdminAccountActions({ userId, isBlacklisted, requiresVerification, displayName, onChanged }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const toggleBlacklist = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_blacklisted: !isBlacklisted })
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !isBlacklisted ? "User blacklisted" : "Blacklist removed" });
      onChanged();
    }
  };

  const toggleVerification = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ requires_verification: !requiresVerification })
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !requiresVerification ? "Verification required" : "Verified" });
      onChanged();
    }
  };

  const deleteAccount = async () => {
    setShowDelete(false);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", { body: { userId } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Account deleted" });
      onChanged();
    } catch (e) {
      toast({
        title: "Failed to delete account",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1.5 items-center">
        {isBlacklisted && (
          <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">
            Blacklisted
          </Badge>
        )}
        {requiresVerification && (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">
            Needs Verify
          </Badge>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={toggleVerification}
          disabled={busy}
          title={requiresVerification ? "Mark verified" : "Require verification"}
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          {requiresVerification ? "Verify" : "Unverify"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={toggleBlacklist}
          disabled={busy}
        >
          <Ban className="w-3 h-3 mr-1" />
          {isBlacklisted ? "Unblock" : "Blacklist"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => setShowDelete(true)}
          disabled={busy}
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserX className="w-3 h-3 mr-1" />Delete</>}
        </Button>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account "{displayName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the user's auth account, profile, group memberships, and roles. Their game records (which use a player name) will remain. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
