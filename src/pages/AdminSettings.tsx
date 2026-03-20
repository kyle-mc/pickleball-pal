import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useGroupContext } from "@/contexts/GroupContext";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";

const AdminSettings = () => {
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const { currentGroup } = useGroupContext();
  const { placementEnabled, loading } = usePlacementEnabled();
  const [localPlacementEnabled, setLocalPlacementEnabled] = useState(placementEnabled);
  const [groupmeUrl, setGroupmeUrl] = useState("");
  const [savingGroupme, setSavingGroupme] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);

  useEffect(() => {
    if (!currentGroup?.id) return;
    supabase
      .from("groups")
      .select("groupme_url")
      .eq("id", currentGroup.id)
      .single()
      .then(({ data }) => {
        setGroupmeUrl((data as any)?.groupme_url ?? "");
      });
  }, [currentGroup?.id]);

  const handleSaveGroupmeUrl = async () => {
    if (!currentGroup?.id) return;
    setSavingGroupme(true);
    const { error } = await supabase
      .from("groups")
      .update({ groupme_url: groupmeUrl || null } as any)
      .eq("id", currentGroup.id);
    setSavingGroupme(false);
    if (error) {
      toast({ title: "Error", description: "Failed to save GroupMe URL", variant: "destructive" });
    } else {
      toast({ title: "GroupMe URL saved" });
    }
  };

  useEffect(() => {
    setLocalPlacementEnabled(placementEnabled);
  }, [placementEnabled]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/profile");
    }
  }, [isAdmin, loading, navigate]);

  const handleTogglePlacement = async (enabled: boolean) => {
    if (!currentGroup?.id) return;
    setLocalPlacementEnabled(enabled);
    const { error } = await supabase
      .from("groups")
      .update({ placement_enabled: enabled } as any)
      .eq("id", currentGroup.id);
    if (error) {
      setLocalPlacementEnabled(!enabled);
      toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
    } else {
      toast({ title: enabled ? "Placement system enabled" : "Placement system disabled" });
    }
  };

  const handleRecalculateMMR = async () => {
    setShowRecalcConfirm(false);
    setRecalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('recalculate-mmr', {
        body: { groupId: currentGroup?.id || null },
      });
      if (error) throw error;
      toast({ 
        title: "MMR Recalculated", 
        description: `Processed ${data.gamesProcessed} games, updated ${data.recordsUpdated} records.` 
      });
    } catch (error) {
      console.error("Recalculation failed:", error);
      toast({ title: "Error", description: "Failed to recalculate MMR. Please try again.", variant: "destructive" });
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-32 md:pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-32 md:pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Admin Settings
          </h1>

          <div className="space-y-6">
            <Card className="bg-card/50 border-border border-primary/30">
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Placement System</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      When enabled, players with fewer than 10 games will have their MMR hidden until they complete placement.
                    </p>
                  </div>
                  <Switch
                    checked={localPlacementEnabled}
                    onCheckedChange={handleTogglePlacement}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  MMR Recalculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Replays all games in chronological order and recalculates every player's MMR from scratch. 
                  Use this after editing or deleting games, or reordering game sequences.
                </p>
                <Button 
                  onClick={() => setShowRecalcConfirm(true)} 
                  disabled={recalculating}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  {recalculating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recalculating...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" />Recalculate All MMR</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  GroupMe Chat Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Paste your GroupMe group link so members can open the chat from the Chat page.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://groupme.com/join_group/..."
                    value={groupmeUrl}
                    onChange={(e) => setGroupmeUrl(e.target.value)}
                  />
                  <Button onClick={handleSaveGroupmeUrl} disabled={savingGroupme}>
                    {savingGroupme ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showRecalcConfirm} onOpenChange={setShowRecalcConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Recalculate All MMR?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replay every game in order and recalculate all player MMR ratings from scratch. 
              This may take a moment depending on the number of games.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalculateMMR} className="bg-primary text-primary-foreground">
              Recalculate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <MobileBottomNav />
    </main>
  );
};

export default AdminSettings;
