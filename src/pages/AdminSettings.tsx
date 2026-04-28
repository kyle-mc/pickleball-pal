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
import { Shield, Loader2, MessageCircle, RefreshCw, Sliders, Users, Trash2, Merge, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useGroupContext } from "@/contexts/GroupContext";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";
import { usePlayers } from "@/hooks/usePlayers";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentSeason } from "@/lib/seasons";
import { AdminFeedbackPanel } from "@/components/admin/AdminFeedbackPanel";
import { AdminAccountActions } from "@/components/admin/AdminAccountActions";

const AdminSettings = () => {
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const { currentGroup } = useGroupContext();
  const { placementEnabled, loading } = usePlacementEnabled();
  const { data: players = [] } = usePlayers();
  const [localPlacementEnabled, setLocalPlacementEnabled] = useState(placementEnabled);
  const [groupmeUrl, setGroupmeUrl] = useState("");
  const [savingGroupme, setSavingGroupme] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);

  // MMR config state
  const [mmrConfig, setMmrConfig] = useState({
    defaultMmr: 2000,
    defaultRd: 350,
    tau: 0.5,
    placementMultiplier: 2,
    placementGames: 10,
    softResetFactor: 0.5,
    goldenPickleMultiplier: 2.0,
    pickledMultiplier: 1.5,
    steamrollerMultiplier: 1.2,
    standardMultiplier: 1.0,
    squeakerMultiplier: 0.9,
    clutchGodMultiplier: 1.0,
    clutchGodBonus: 2,
  });

  // Recalc options
  const currentSeason = getCurrentSeason();
  const [recalcMode, setRecalcMode] = useState<'all' | 'season' | 'from_date'>('all');
  const [recalcSeason, setRecalcSeason] = useState(currentSeason.id.toString());
  const [recalcFromDate, setRecalcFromDate] = useState('');

  // User management state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [playerLinks, setPlayerLinks] = useState<Record<string, string>>({});

  // Player merge state
  const [mergeFrom, setMergeFrom] = useState('');
  const [mergeInto, setMergeInto] = useState('');
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  // Player delete state
  const [deletePlayerName, setDeletePlayerName] = useState<string | null>(null);
  const [deletePlayerGameCount, setDeletePlayerGameCount] = useState<number>(0);
  const [deleteReplaceWith, setDeleteReplaceWith] = useState<string>('');
  const [checkingGameCount, setCheckingGameCount] = useState(false);
  const queryClient = useQueryClient();

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

  useEffect(() => {
    setLocalPlacementEnabled(placementEnabled);
  }, [placementEnabled]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/profile");
    }
  }, [isAdmin, loading, navigate]);

  // Load users
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    supabase
      .from("profiles")
      .select("user_id, display_name, linked_player_id, avatar_url, created_at, players!profiles_linked_player_id_fkey(name)")
      .then(({ data }) => {
        setAllUsers(data || []);
        const links: Record<string, string> = {};
        data?.forEach((u: any) => {
          if (u.linked_player_id) {
            links[u.user_id] = u.linked_player_id;
          }
        });
        setPlayerLinks(links);
        setLoadingUsers(false);
      });
  }, [isAdmin]);

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
      const body: any = { groupId: currentGroup?.id || null };
      if (recalcMode === 'season') {
        body.season = parseInt(recalcSeason);
      } else if (recalcMode === 'from_date') {
        body.fromDate = recalcFromDate;
      }
      // Pass MMR config overrides
      body.mmrConfig = mmrConfig;

      const { data, error } = await supabase.functions.invoke('recalculate-mmr', { body });
      if (error) throw error;
      toast({ 
        title: "MMR Recalculated", 
        description: `Processed ${data.gamesProcessed ?? 0} games, updated ${data.recordsUpdated ?? 0} records.` 
      });
    } catch (error) {
      console.error("Recalculation failed:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to recalculate MMR. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleAssignRole = async (userId: string, role: 'admin' | 'user') => {
    if (role === 'admin') {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      if (error && error.code !== '23505') {
        toast({ title: "Error", description: "Failed to assign admin role", variant: "destructive" });
        return;
      }
    } else {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
    }
    toast({ title: role === 'admin' ? "Admin role assigned" : "Admin role removed" });
  };

  const handleLinkPlayer = async (userId: string, playerName: string) => {
    // Find player ID by name
    const { data: player } = await supabase.from('players').select('id').eq('name', playerName).single();
    if (!player) {
      toast({ title: "Error", description: "Player not found", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('profiles').update({ linked_player_id: player.id }).eq('user_id', userId);
    if (error) {
      toast({ title: "Error", description: "Failed to link player", variant: "destructive" });
    } else {
      setPlayerLinks(prev => ({ ...prev, [userId]: player.id }));
      toast({ title: "Player linked" });
    }
  };

  const handleMergePlayers = async () => {
    setShowMergeConfirm(false);
    if (!mergeFrom || !mergeInto || mergeFrom === mergeInto) return;
    
    // Update all games from mergeFrom to mergeInto
    const { error: gamesError } = await supabase.from('games').update({ player: mergeInto }).eq('player', mergeFrom);
    if (gamesError) {
      toast({ title: "Error", description: "Failed to merge game records", variant: "destructive" });
      return;
    }
    // Update season stats
    await supabase.from('player_season_stats').update({ player: mergeInto }).eq('player', mergeFrom);
    // Delete the old player record (now allowed by admin RLS)
    const { error: deleteErr } = await supabase.from('players').delete().eq('name', mergeFrom);
    if (deleteErr) {
      toast({ title: "Records merged but old player not deleted", description: deleteErr.message, variant: "destructive" });
    } else {
      toast({ title: "Players merged", description: `${mergeFrom} merged into ${mergeInto}. Run MMR Recalculation to update ratings.` });
    }
    // Invalidate queries so UI refreshes
    await queryClient.invalidateQueries({ queryKey: ['players'] });
    await queryClient.invalidateQueries({ queryKey: ['games'] });
    setMergeFrom('');
    setMergeInto('');
  };

  // Step 1: User clicks delete — count games and open confirmation dialog
  const handleRequestDeletePlayer = async (name: string) => {
    setDeletePlayerName(name);
    setDeleteReplaceWith('');
    setCheckingGameCount(true);
    const { count } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('player', name);
    setDeletePlayerGameCount(count ?? 0);
    setCheckingGameCount(false);
  };

  // Step 2: User confirms delete (with optional replacement player)
  const handleConfirmDeletePlayer = async () => {
    if (!deletePlayerName) return;
    const name = deletePlayerName;
    const replaceWith = deleteReplaceWith;

    try {
      if (deletePlayerGameCount > 0) {
        if (replaceWith) {
          // Reassign games & season stats to replacement player
          const { error: gErr } = await supabase.from('games').update({ player: replaceWith }).eq('player', name);
          if (gErr) throw gErr;
          await supabase.from('player_season_stats').update({ player: replaceWith }).eq('player', name);
        } else {
          // No replacement: delete all games featuring this player (affects 3 other players too).
          // Find all (date, game_number) pairs where this player participated, then delete those whole games.
          const { data: gameRows } = await supabase
            .from('games')
            .select('date, game_number, group_id')
            .eq('player', name);
          if (gameRows && gameRows.length > 0) {
            for (const g of gameRows) {
              await supabase
                .from('games')
                .delete()
                .eq('date', g.date)
                .eq('game_number', g.game_number)
                .eq('group_id', g.group_id ?? null as any);
            }
          }
          // Clean up season stats for this player
          await supabase.from('player_season_stats').delete().eq('player', name);
        }
      }

      // Delete the player record
      const { error: pErr } = await supabase.from('players').delete().eq('name', name);
      if (pErr) throw pErr;

      toast({
        title: "Player deleted",
        description: deletePlayerGameCount > 0
          ? (replaceWith
              ? `Reassigned ${deletePlayerGameCount} games to ${replaceWith}.`
              : `Deleted ${deletePlayerGameCount} games. Run MMR Recalculation.`)
          : `${name} had no games.`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message ?? "Failed to delete player", variant: "destructive" });
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      await queryClient.invalidateQueries({ queryKey: ['games'] });
      setDeletePlayerName(null);
      setDeleteReplaceWith('');
      setDeletePlayerGameCount(0);
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

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="mmr">MMR Config</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card className="bg-card/50 border-border border-primary/30">
                <CardHeader><CardTitle>Group Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Placement System</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        When enabled, players with fewer than 10 games will have their MMR hidden.
                      </p>
                    </div>
                    <Switch checked={localPlacementEnabled} onCheckedChange={handleTogglePlacement} />
                  </div>
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
                  <p className="text-xs text-muted-foreground">Paste your GroupMe group link so members can open the chat from the Chat page.</p>
                  <div className="flex gap-2">
                    <Input placeholder="https://groupme.com/join_group/..." value={groupmeUrl} onChange={(e) => setGroupmeUrl(e.target.value)} />
                    <Button onClick={handleSaveGroupmeUrl} disabled={savingGroupme}>
                      {savingGroupme ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
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
                    Replays games and recalculates all player MMR. Use after editing/deleting games. All players reset to starting MMR at the beginning of each season.
                  </p>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">Recalculation Scope</Label>
                    <Select value={recalcMode} onValueChange={(v: any) => setRecalcMode(v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Games (All Seasons)</SelectItem>
                        <SelectItem value="season">Specific Season</SelectItem>
                        <SelectItem value="from_date">From Specific Date</SelectItem>
                      </SelectContent>
                    </Select>

                    {recalcMode === 'season' && (
                      <Select value={recalcSeason} onValueChange={setRecalcSeason}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Season 1</SelectItem>
                          <SelectItem value="2">Season 2</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {recalcMode === 'from_date' && (
                      <Input type="date" value={recalcFromDate} onChange={e => setRecalcFromDate(e.target.value)} />
                    )}
                  </div>

                  <Button 
                    onClick={() => setShowRecalcConfirm(true)} 
                    disabled={recalculating}
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {recalculating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recalculating...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" />Recalculate MMR</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MMR Config Tab */}
            <TabsContent value="mmr" className="space-y-6">
              <Card className="bg-card/50 border-border border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    MMR Calculation Variables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Adjust these values and run Recalculate MMR to see how changes affect ratings. These overrides apply only during recalculation.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Default Starting MMR</Label>
                      <Input type="number" value={mmrConfig.defaultMmr} onChange={e => setMmrConfig(c => ({ ...c, defaultMmr: +e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Default RD</Label>
                      <Input type="number" value={mmrConfig.defaultRd} onChange={e => setMmrConfig(c => ({ ...c, defaultRd: +e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">System Volatility (τ)</Label>
                      <Input type="number" step="0.1" value={mmrConfig.tau} onChange={e => setMmrConfig(c => ({ ...c, tau: +e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Placement Boost Multiplier</Label>
                      <Input type="number" step="0.1" value={mmrConfig.placementMultiplier} onChange={e => setMmrConfig(c => ({ ...c, placementMultiplier: +e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Placement Games Count</Label>
                      <Input type="number" value={mmrConfig.placementGames} onChange={e => setMmrConfig(c => ({ ...c, placementGames: +e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Soft Reset Factor</Label>
                      <Input type="number" step="0.1" value={mmrConfig.softResetFactor} onChange={e => setMmrConfig(c => ({ ...c, softResetFactor: +e.target.value }))} />
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-4">
                    <Label className="text-sm font-medium">Victory Type Multipliers</Label>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">🏆 Golden Pickle (×)</Label>
                        <Input type="number" step="0.1" value={mmrConfig.goldenPickleMultiplier} onChange={e => setMmrConfig(c => ({ ...c, goldenPickleMultiplier: +e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">🥒 Pickled (×)</Label>
                        <Input type="number" step="0.1" value={mmrConfig.pickledMultiplier} onChange={e => setMmrConfig(c => ({ ...c, pickledMultiplier: +e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">🚂 Steamroller (×)</Label>
                        <Input type="number" step="0.1" value={mmrConfig.steamrollerMultiplier} onChange={e => setMmrConfig(c => ({ ...c, steamrollerMultiplier: +e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">⭐ Standard (×)</Label>
                        <Input type="number" step="0.1" value={mmrConfig.standardMultiplier} onChange={e => setMmrConfig(c => ({ ...c, standardMultiplier: +e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">🐁 Squeaker (×)</Label>
                        <Input type="number" step="0.1" value={mmrConfig.squeakerMultiplier} onChange={e => setMmrConfig(c => ({ ...c, squeakerMultiplier: +e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">🔥👑 Clutch God (×)</Label>
                        <Input type="number" step="0.1" value={mmrConfig.clutchGodMultiplier} onChange={e => setMmrConfig(c => ({ ...c, clutchGodMultiplier: +e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">🔥👑 Clutch God Bonus (pts)</Label>
                        <Input type="number" value={mmrConfig.clutchGodBonus} onChange={e => setMmrConfig(c => ({ ...c, clutchGodBonus: +e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-card/50 border-border border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    User Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : (
                    <div className="space-y-3">
                      {allUsers.map((user: any) => {
                        const playerName = (user.players as any)?.name || 'Unlinked';
                        return (
                          <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">
                                {user.display_name || 'No name'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Player: {playerName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Joined {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Select
                                value={playerLinks[user.user_id] ? players.find(p => {
                                  // rough match
                                  return p === playerName;
                                }) || '' : ''}
                                onValueChange={(val) => handleLinkPlayer(user.user_id, val)}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue placeholder="Link player" />
                                </SelectTrigger>
                                <SelectContent>
                                  {players.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleAssignRole(user.user_id, 'admin')}
                              >
                                Make Admin
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Players Tab */}
            <TabsContent value="players" className="space-y-6">
              <Card className="bg-card/50 border-border border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Merge className="w-5 h-5 text-primary" />
                    Merge Players
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Merge a duplicate player into an existing one. All game records will be transferred.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Merge from (will be deleted)</Label>
                      <Select value={mergeFrom} onValueChange={setMergeFrom}>
                        <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                        <SelectContent>
                          {players.filter(p => p !== mergeInto).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Merge into (will keep)</Label>
                      <Select value={mergeInto} onValueChange={setMergeInto}>
                        <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                        <SelectContent>
                          {players.filter(p => p !== mergeFrom).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    disabled={!mergeFrom || !mergeInto}
                    onClick={() => setShowMergeConfirm(true)}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Merge className="w-4 h-4 mr-2" />
                    Merge Players
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border border-primary/30">
                <CardHeader><CardTitle>All Players</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {players.map(name => (
                      <div key={name} className="flex items-center justify-between p-2 rounded border border-border">
                        <span className="text-sm text-foreground">{name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRequestDeletePlayer(name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={showRecalcConfirm} onOpenChange={setShowRecalcConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Recalculate MMR?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replay {recalcMode === 'all' ? 'all games across all seasons' : recalcMode === 'season' ? `Season ${recalcSeason} games` : `games from ${recalcFromDate}`} and recalculate all player MMR ratings. All players will start at {mmrConfig.defaultMmr} MMR at the beginning of each season.
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

      <AlertDialog open={showMergeConfirm} onOpenChange={setShowMergeConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Players?</AlertDialogTitle>
            <AlertDialogDescription>
              All game records for <strong>{mergeFrom}</strong> will be transferred to <strong>{mergeInto}</strong>, and "{mergeFrom}" will be deleted. This cannot be undone. You should run MMR Recalculation afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMergePlayers} className="bg-destructive text-destructive-foreground">
              Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete player confirmation — shows game count and optional replacement */}
      <AlertDialog
        open={!!deletePlayerName}
        onOpenChange={(o) => { if (!o) { setDeletePlayerName(null); setDeleteReplaceWith(''); } }}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete player "{deletePlayerName}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                {checkingGameCount ? (
                  <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Counting games…</div>
                ) : deletePlayerGameCount === 0 ? (
                  <p>This player has <strong>0 games</strong> logged. Safe to delete.</p>
                ) : (
                  <>
                    <p>
                      This player has <strong className="text-foreground">{deletePlayerGameCount} game record{deletePlayerGameCount === 1 ? '' : 's'}</strong>.
                    </p>
                    <p>
                      Pick a replacement player (recommended) to reassign all of their games. If you leave this blank, those games will be <strong className="text-destructive">deleted entirely</strong>, which also removes the records of the other 3 players in each game.
                    </p>
                    <div className="pt-1">
                      <Label className="text-xs text-foreground">Replace with</Label>
                      <Select value={deleteReplaceWith} onValueChange={setDeleteReplaceWith}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="-- Don't replace, delete games --" /></SelectTrigger>
                        <SelectContent>
                          {players.filter(p => p !== deletePlayerName).map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletePlayer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlayerGameCount > 0 && !deleteReplaceWith ? 'Delete player & games' : 'Delete'}
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
