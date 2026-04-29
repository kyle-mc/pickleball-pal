import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GameRecord } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { useSubmitGame } from "@/hooks/useGames";
import { useCurrentGroup } from "@/hooks/useGroups";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { getVictoryTypeFromScore } from "@/lib/victoryTypes";
import { ArrowLeftRight, Copy, Loader2, Trash2 } from "lucide-react";

interface GameEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameRows: GameRecord[] | null;
  /** Optional override: when provided, called instead of submitting a duplicate.
   *  Use this to open a pre-filled "new game" dialog. */
  onRequestDuplicate?: (rows: GameRecord[]) => void;
}

const formatTimeInput = (playedAt?: string) => {
  if (!playedAt) return "";
  const date = new Date(playedAt);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export default function GameEditDialog({ open, onOpenChange, gameRows, onRequestDuplicate }: GameEditDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: players = [] } = usePlayers();
  const submitGameMutation = useSubmitGame();
  const { currentGroup } = useCurrentGroup();
  const [duplicating, setDuplicating] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [gameNumber, setGameNumber] = useState("1");
  const [winningPlayer1, setWinningPlayer1] = useState("");
  const [winningPlayer2, setWinningPlayer2] = useState("");
  const [losingPlayer1, setLosingPlayer1] = useState("");
  const [losingPlayer2, setLosingPlayer2] = useState("");
  const [winningScore, setWinningScore] = useState("11");
  const [losingScore, setLosingScore] = useState("0");
  const [neverServed, setNeverServed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!open || !gameRows?.length) return;

    const winners = gameRows.filter((row) => row.result === "Winner");
    const losers = gameRows.filter((row) => row.result === "Loser");
    const score = gameRows[0]?.score ?? "11-0";
    const [wScore, lScore] = score.split("-").map((part) => part.trim());

    setDate(gameRows[0]?.date ?? "");
    setTime(formatTimeInput(gameRows[0]?.playedAt));
    setGameNumber(String(gameRows[0]?.game ?? 1));
    setWinningPlayer1(winners[0]?.player ?? "");
    setWinningPlayer2(winners[1]?.player ?? "");
    setLosingPlayer1(losers[0]?.player ?? "");
    setLosingPlayer2(losers[1]?.player ?? "");
    setWinningScore(wScore || "11");
    setLosingScore(lScore || "0");
    setNeverServed(gameRows[0]?.victoryType === "golden_pickle");
  }, [open, gameRows]);

  const selectedPlayers = [winningPlayer1, winningPlayer2, losingPlayer1, losingPlayer2].filter(Boolean);

  const getAvailablePlayers = (currentValue: string) =>
    players.filter((player) => !selectedPlayers.includes(player) || player === currentValue);

  const renderPlayerSelect = (value: string, onChange: (value: string) => void, placeholder: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-muted border-border">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-card border-border z-50">
        {getAvailablePlayers(value).map((player) => (
          <SelectItem key={player} value={player}>
            {player}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const previewVictoryType = useMemo(() => {
    const wScore = Number.parseInt(winningScore, 10);
    const lScore = Number.parseInt(losingScore, 10);

    if (Number.isNaN(wScore) || Number.isNaN(lScore)) return null;
    return getVictoryTypeFromScore(wScore, lScore, neverServed);
  }, [winningScore, losingScore, neverServed]);

  const handleSwapTeams = () => {
    const nextWinning = [losingPlayer1, losingPlayer2];
    const nextLosing = [winningPlayer1, winningPlayer2];
    setWinningPlayer1(nextWinning[0]);
    setWinningPlayer2(nextWinning[1]);
    setLosingPlayer1(nextLosing[0]);
    setLosingPlayer2(nextLosing[1]);
  };

  const buildPlayedAt = () => {
    if (!date) return null;
    const safeTime = time || "00:00";
    return new Date(`${date}T${safeTime}:00`).toISOString();
  };

  const handleSave = async () => {
    if (!gameRows?.length) return;

    const participants = [winningPlayer1, winningPlayer2, losingPlayer1, losingPlayer2];
    if (participants.some((player) => !player)) {
      toast({ title: "Missing Players", description: "Select all 4 players before saving.", variant: "destructive" });
      return;
    }

    if (new Set(participants).size !== 4) {
      toast({ title: "Duplicate Players", description: "Each player can only appear once in a game.", variant: "destructive" });
      return;
    }

    const wScore = Number.parseInt(winningScore, 10);
    const lScore = Number.parseInt(losingScore, 10);
    const parsedGameNumber = Number.parseInt(gameNumber, 10);

    if (Number.isNaN(wScore) || Number.isNaN(lScore) || Number.isNaN(parsedGameNumber)) {
      toast({ title: "Invalid Values", description: "Check the score and game number fields.", variant: "destructive" });
      return;
    }

    if (wScore <= lScore || wScore - lScore < 2) {
      toast({ title: "Invalid Score", description: "Winning team must have the higher score and win by at least 2.", variant: "destructive" });
      return;
    }

    const winners = gameRows.filter((row) => row.result === "Winner");
    const losers = gameRows.filter((row) => row.result === "Loser");

    if (winners.length !== 2 || losers.length !== 2) {
      toast({ title: "Game Error", description: "This game is missing player rows and could not be edited.", variant: "destructive" });
      return;
    }

    const playedAt = buildPlayedAt();
    const score = `${wScore}-${lScore}`;
    const victoryType = getVictoryTypeFromScore(wScore, lScore, neverServed).id;

    setSaving(true);
    try {
      const updates = [
        { id: winners[0].id, player: winningPlayer1, result: "Winner" as const },
        { id: winners[1].id, player: winningPlayer2, result: "Winner" as const },
        { id: losers[0].id, player: losingPlayer1, result: "Loser" as const },
        { id: losers[1].id, player: losingPlayer2, result: "Loser" as const },
      ];

      await Promise.all(
        updates.map((update) =>
          supabase
            .from("games")
            .update({
              date,
              played_at: playedAt,
              game_number: parsedGameNumber,
              player: update.player,
              result: update.result,
              score,
              victory_type: victoryType,
            } as any)
            .eq("id", update.id!)
        )
      );

      queryClient.invalidateQueries({ queryKey: ["games"] });
      onOpenChange(false);
      toast({
        title: "Game updated",
        description: "Changes are saved. An admin can run Recalculate All MMR when you're ready to refresh ratings.",
      });
    } catch (error) {
      console.error("Failed to update game:", error);
      toast({ title: "Update failed", description: "Could not save this game.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gameRows?.length) return;

    setSaving(true);
    try {
      const ids = gameRows.map((row) => row.id).filter(Boolean) as string[];
      const { error } = await supabase.from("games").delete().in("id", ids);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["games"] });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      toast({
        title: "Game deleted",
        description: "The game was removed. An admin can run Recalculate All MMR when you're ready to refresh ratings.",
      });
    } catch (error) {
      console.error("Failed to delete game:", error);
      toast({ title: "Delete failed", description: "Could not delete this game.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    // If parent wants to handle duplication (e.g. open a pre-filled entry dialog), defer to it.
    if (onRequestDuplicate && gameRows) {
      onRequestDuplicate(gameRows);
      onOpenChange(false);
      return;
    }

    const wScore = Number.parseInt(winningScore, 10);
    const lScore = Number.parseInt(losingScore, 10);
    const participants = [winningPlayer1, winningPlayer2, losingPlayer1, losingPlayer2];

    if (participants.some((p) => !p) || new Set(participants).size !== 4) {
      toast({ title: "Cannot duplicate", description: "Fix any player issues first.", variant: "destructive" });
      return;
    }
    if (Number.isNaN(wScore) || Number.isNaN(lScore) || wScore <= lScore || wScore - lScore < 2) {
      toast({ title: "Cannot duplicate", description: "Fix the score first.", variant: "destructive" });
      return;
    }

    setDuplicating(true);
    try {
      await submitGameMutation.mutateAsync({
        winningPlayers: [winningPlayer1, winningPlayer2],
        losingPlayers: [losingPlayer1, losingPlayer2],
        winningScore: wScore,
        losingScore: lScore,
        date,
        groupId: currentGroup?.id,
        neverServed,
        gameMode: gameRows?.[0]?.gameMode || 'doubles',
      });
      toast({ title: "Game duplicated", description: "A new game was created with the same teams and score." });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to duplicate game:", error);
      toast({ title: "Duplicate failed", description: "Could not duplicate this game.", variant: "destructive" });
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update the teams, score, date, time, or game number. Ratings stay as-is until an admin runs Recalculate All MMR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-muted-foreground">Date</Label>
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="bg-muted border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground">Game #</Label>
                <Input type="number" min={1} value={gameNumber} onChange={(event) => setGameNumber(event.target.value)} className="bg-muted border-border" />
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Played time</Label>
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="bg-muted border-border" />
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
              <Label className="text-primary font-medium">Winning Team</Label>
              <div className="grid grid-cols-2 gap-3">
                {renderPlayerSelect(winningPlayer1, setWinningPlayer1, "Player 1")}
                {renderPlayerSelect(winningPlayer2, setWinningPlayer2, "Player 2")}
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Score</Label>
                <Input type="number" min={0} max={99} value={winningScore} onChange={(event) => setWinningScore(event.target.value)} className="bg-muted border-border mt-1" />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Button type="button" variant="outline" onClick={handleSwapTeams} className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                <ArrowLeftRight className="w-4 h-4" />
                Swap Teams
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
              <Label className="text-destructive font-medium">Losing Team</Label>
              <div className="grid grid-cols-2 gap-3">
                {renderPlayerSelect(losingPlayer1, setLosingPlayer1, "Player 1")}
                {renderPlayerSelect(losingPlayer2, setLosingPlayer2, "Player 2")}
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Score</Label>
                <Input type="number" min={0} max={99} value={losingScore} onChange={(event) => setLosingScore(event.target.value)} className="bg-muted border-border mt-1" />
              </div>

              {Number.parseInt(winningScore, 10) === 11 && Number.parseInt(losingScore, 10) === 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 py-2">
                  <Checkbox id="edit-never-served" checked={neverServed} onCheckedChange={(checked) => setNeverServed(Boolean(checked))} />
                  <label htmlFor="edit-never-served" className="text-sm text-foreground cursor-pointer">
                    Losing team never served (Golden Pickle)
                  </label>
                </div>
              )}
            </div>

            {previewVictoryType && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <span className="text-sm text-muted-foreground">Victory Type</span>
                <VictoryTypeBadge victoryTypeId={previewVictoryType.id} showLabel />
              </div>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)} disabled={saving || duplicating}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={handleDuplicate} disabled={saving || duplicating} className="border-primary/30 text-primary hover:bg-primary/10">
              {duplicating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Duplicate
            </Button>
            <Button type="button" variant="hero" onClick={handleSave} disabled={saving || duplicating}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this game?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all 4 player rows for the game. Ratings will stay unchanged until an admin runs Recalculate All MMR.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}