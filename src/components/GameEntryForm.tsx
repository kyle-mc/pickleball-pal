import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubmitGame } from "@/hooks/useGames";
import { usePlayers, useAddPlayer } from "@/hooks/usePlayers";
import { useCurrentGroup } from "@/hooks/useGroups";
import { getCurrentSeason } from "@/lib/seasons";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { getVictoryTypeFromScore } from "@/lib/victoryTypes";

interface GameEntryFormProps {
  onGameAdded?: () => void;
}

const GameEntryForm = ({ onGameAdded }: GameEntryFormProps) => {
  const { toast } = useToast();
  const { data: players = [] } = usePlayers();
  const submitGameMutation = useSubmitGame();
  const addPlayerMutation = useAddPlayer();
  const { currentGroup } = useCurrentGroup();

  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [winningPlayer1, setWinningPlayer1] = useState("");
  const [winningPlayer2, setWinningPlayer2] = useState("");
  const [losingPlayer1, setLosingPlayer1] = useState("");
  const [losingPlayer2, setLosingPlayer2] = useState("");
  const [winningScore, setWinningScore] = useState("11");
  const [losingScore, setLosingScore] = useState("");
  
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showNewPlayerInput, setShowNewPlayerInput] = useState(false);

  const currentSeason = getCurrentSeason();

  // Calculate preview of victory type based on scores
  const previewVictoryType = winningScore && losingScore 
    ? getVictoryTypeFromScore(parseInt(winningScore), parseInt(losingScore))
    : null;

  const handleAddNewPlayer = async () => {
    const name = newPlayerName.trim();
    if (!name) {
      toast({ title: "Invalid Name", description: "Please enter a player name.", variant: "destructive" });
      return;
    }
    if (players.includes(name)) {
      toast({ title: "Player Exists", description: "This player already exists.", variant: "destructive" });
      return;
    }
    try {
      await addPlayerMutation.mutateAsync(name);
      toast({ title: "Player Added!", description: `${name} has been added.` });
      setNewPlayerName("");
      setShowNewPlayerInput(false);
    } catch {
      toast({ title: "Error", description: "Failed to add player.", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!winningPlayer1 || !winningPlayer2 || !losingPlayer1 || !losingPlayer2) {
      toast({ title: "Missing Players", description: "Please select all 4 players.", variant: "destructive" });
      return;
    }
    if (!winningScore || !losingScore) {
      toast({ title: "Missing Scores", description: "Please enter scores for both teams.", variant: "destructive" });
      return;
    }
    const wScore = parseInt(winningScore);
    const lScore = parseInt(losingScore);
    if (wScore <= lScore) {
      toast({ title: "Invalid Scores", description: "Winning team score must be higher.", variant: "destructive" });
      return;
    }

    // Validate winning score is at least 11 and margin is 2 if score > 11
    if (wScore < 11) {
      toast({ title: "Invalid Scores", description: "Winning score must be at least 11.", variant: "destructive" });
      return;
    }
    if (wScore > 11 && wScore - lScore !== 2) {
      toast({ title: "Invalid Scores", description: "For scores above 11, margin must be exactly 2.", variant: "destructive" });
      return;
    }

    const winningPlayers = [winningPlayer1, winningPlayer2];
    const losingPlayers = [losingPlayer1, losingPlayer2];

    try {
      // Add any new players first
      const allPlayersInGame = [...winningPlayers, ...losingPlayers];
      for (const player of allPlayersInGame) {
        if (!players.includes(player)) {
          await addPlayerMutation.mutateAsync(player);
        }
      }

      // Submit game to edge function for server-side MMR calculation
      await submitGameMutation.mutateAsync({
        winningPlayers,
        losingPlayers,
        winningScore: wScore,
        losingScore: lScore,
        date,
        groupId: currentGroup?.id,
      });

      toast({ 
        title: "Game Recorded!", 
        description: `Season ${currentSeason.id} game has been recorded with MMR calculations.` 
      });
      
      // Reset form
      setWinningPlayer1(""); 
      setWinningPlayer2(""); 
      setLosingPlayer1(""); 
      setLosingPlayer2("");
      setWinningScore("11"); 
      setLosingScore(""); 
      setIsOpen(false);
      onGameAdded?.();
    } catch (error) {
      console.error("Failed to save game:", error);
      toast({ title: "Error", description: "Failed to save game. Please try again.", variant: "destructive" });
    }
  };

  const selectedPlayers = [winningPlayer1, winningPlayer2, losingPlayer1, losingPlayer2].filter(Boolean);
  const getAvailablePlayers = (currentValue: string) => players.filter(p => !selectedPlayers.includes(p) || p === currentValue);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="hero"><Plus className="w-4 h-4 mr-2" />Add Game</Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            Record New Game
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
              Season {currentSeason.id}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted border-border" />
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            {showNewPlayerInput ? (
              <div className="flex gap-2">
                <Input placeholder="New player name" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} className="bg-background border-border flex-1" onKeyDown={e => e.key === 'Enter' && handleAddNewPlayer()} />
                <Button size="sm" onClick={handleAddNewPlayer} disabled={addPlayerMutation.isPending}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewPlayerInput(false); setNewPlayerName(""); }}>Cancel</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowNewPlayerInput(true)} className="w-full text-muted-foreground">
                <UserPlus className="w-4 h-4 mr-2" />Add New Player
              </Button>
            )}
          </div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Label className="text-primary font-medium mb-3 block">🏆 Winning Team</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={winningPlayer1} onValueChange={setWinningPlayer1}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Player 1" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">{getAvailablePlayers(winningPlayer1).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={winningPlayer2} onValueChange={setWinningPlayer2}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Player 2" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">{getAvailablePlayers(winningPlayer2).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              <Label className="text-muted-foreground text-sm">Score</Label>
              <Input type="number" placeholder="11" value={winningScore} onChange={e => setWinningScore(e.target.value)} className="bg-muted border-border w-24" />
            </div>
          </div>
          <div className="text-center text-muted-foreground font-medium">VS</div>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <Label className="text-destructive font-medium mb-3 block">Losing Team</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={losingPlayer1} onValueChange={setLosingPlayer1}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Player 1" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">{getAvailablePlayers(losingPlayer1).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={losingPlayer2} onValueChange={setLosingPlayer2}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Player 2" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-50">{getAvailablePlayers(losingPlayer2).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              <Label className="text-muted-foreground text-sm">Score</Label>
              <Input type="number" placeholder="9" value={losingScore} onChange={e => setLosingScore(e.target.value)} className="bg-muted border-border w-24" />
            </div>
          </div>

          {previewVictoryType && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Victory Type:</span>
              <VictoryTypeBadge victoryTypeId={previewVictoryType.id} showLabel />
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full" variant="hero" disabled={submitGameMutation.isPending}>
            {submitGameMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating MMR...
              </>
            ) : (
              "Record Game"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameEntryForm;
