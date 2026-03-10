import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubmitGame, useGames } from "@/hooks/useGames";
import { usePlayers, useAddPlayer } from "@/hooks/usePlayers";
import { useCurrentGroup } from "@/hooks/useGroups";
import { getCurrentSeason, getSeasonFromDate } from "@/lib/seasons";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { SeasonConfirmDialog } from "@/components/SeasonConfirmDialog";
import { MatchPreview } from "@/components/MatchPreview";
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
  const [losingScore, setLosingScore] = useState("0");
  
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showNewPlayerInput, setShowNewPlayerInput] = useState(false);
  const [showSeasonConfirm, setShowSeasonConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const currentSeason = getCurrentSeason();
  const dateSeason = getSeasonFromDate(date);
  const isCurrentSeason = dateSeason.id === currentSeason.id;

  // Score validation logic
  const handleWinningScoreChange = (value: string) => {
    const wScore = parseInt(value);
    if (!isNaN(wScore) && wScore > 99) return; // Cap at 99
    setWinningScore(value);
    
    if (!isNaN(wScore) && wScore > 11) {
      // Auto-set losing score to wScore - 2
      setLosingScore(String(wScore - 2));
    }
  };

  const handleWinningScoreSlider = (v: number) => {
    if (v > 99) return;
    setWinningScore(String(v));
    if (v > 11) {
      setLosingScore(String(v - 2));
    }
  };

  const handleLosingScoreChange = (value: string) => {
    const lScore = parseInt(value);
    const wScore = parseInt(winningScore);
    if (isNaN(lScore)) { setLosingScore(value); return; }
    
    // Don't allow losing score within less than 2 of winning score
    if (!isNaN(wScore) && wScore - lScore < 2) return;
    setLosingScore(value);
  };

  const handleLosingScoreSlider = (v: number) => {
    const wScore = parseInt(winningScore);
    if (!isNaN(wScore) && wScore - v < 2) return;
    setLosingScore(String(v));
  };

  const previewVictoryType = winningScore && losingScore 
    ? getVictoryTypeFromScore(parseInt(winningScore), parseInt(losingScore))
    : null;

  const allPlayersSelected = winningPlayer1 && winningPlayer2 && losingPlayer1 && losingPlayer2;
  const team1 = useMemo(() => [winningPlayer1, winningPlayer2].filter(Boolean), [winningPlayer1, winningPlayer2]);
  const team2 = useMemo(() => [losingPlayer1, losingPlayer2].filter(Boolean), [losingPlayer1, losingPlayer2]);

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

  const handleSwapTeams = () => {
    const tempP1 = winningPlayer1;
    const tempP2 = winningPlayer2;
    setWinningPlayer1(losingPlayer1);
    setWinningPlayer2(losingPlayer2);
    setLosingPlayer1(tempP1);
    setLosingPlayer2(tempP2);
  };

  const doSubmit = async () => {
    const wScore = parseInt(winningScore);
    const lScore = parseInt(losingScore);
    const winningPlayers = [winningPlayer1, winningPlayer2];
    const losingPlayers = [losingPlayer1, losingPlayer2];

    try {
      const allPlayersInGame = [...winningPlayers, ...losingPlayers];
      for (const player of allPlayersInGame) {
        if (!players.includes(player)) {
          await addPlayerMutation.mutateAsync(player);
        }
      }

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
        description: `Season ${dateSeason.id} game has been recorded with MMR calculations.` 
      });
      
      setWinningPlayer1(""); 
      setWinningPlayer2(""); 
      setLosingPlayer1(""); 
      setLosingPlayer2("");
      setWinningScore("11"); 
      setLosingScore("0"); 
      setIsOpen(false);
      onGameAdded?.();
    } catch (error) {
      console.error("Failed to save game:", error);
      toast({ title: "Error", description: "Failed to save game. Please try again.", variant: "destructive" });
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
    if (wScore - lScore < 2) {
      toast({ title: "Invalid Scores", description: "Winning team must win by at least 2.", variant: "destructive" });
      return;
    }
    if (wScore > 11 && wScore - lScore !== 2) {
      toast({ title: "Invalid Scores", description: "For scores above 11, margin must be exactly 2.", variant: "destructive" });
      return;
    }

    // Warn if winning score is less than 11
    if (wScore < 11) {
      const confirmShort = window.confirm(
        `The winning score is ${wScore}, which is less than the standard 11. This typically means the game was cut short. Are you sure you want to record this game?`
      );
      if (!confirmShort) return;
    }

    if (!isCurrentSeason) {
      setPendingSubmit(true);
      setShowSeasonConfirm(true);
      return;
    }

    await doSubmit();
  };

  const handleSeasonConfirm = async () => {
    setShowSeasonConfirm(false);
    if (pendingSubmit) {
      setPendingSubmit(false);
      await doSubmit();
    }
  };

  const selectedPlayers = [winningPlayer1, winningPlayer2, losingPlayer1, losingPlayer2].filter(Boolean);
  const getAvailablePlayers = (currentValue: string) => players.filter(p => !selectedPlayers.includes(p) || p === currentValue);

  const renderPlayerSelect = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-muted border-border"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="bg-card border-border z-50">
        <SelectItem value="__new__" className="text-primary font-medium border-b border-border">
          <span className="flex items-center gap-1">
            <UserPlus className="w-3 h-3" />
            Add New Player
          </span>
        </SelectItem>
        {getAvailablePlayers(value).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const handlePlayerChange = (setter: (v: string) => void) => (value: string) => {
    if (value === "__new__") {
      setShowNewPlayerInput(true);
    } else {
      setter(value);
    }
  };

  // Compute max losing score based on winning score
  const maxLosingScore = useMemo(() => {
    const wScore = parseInt(winningScore);
    if (isNaN(wScore)) return 15;
    return Math.max(0, wScore - 2);
  }, [winningScore]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="hero" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Add Game</Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              Record New Game
              <span className={`text-xs px-2 py-0.5 rounded ${
                isCurrentSeason 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                Season {dateSeason.id}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted border-border" />
              {!isCurrentSeason && (
                <p className="text-xs text-yellow-500 mt-1">
                  ⚠️ This date is in Season {dateSeason.id}, not the current season
                </p>
              )}
            </div>

            {showNewPlayerInput && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex gap-2">
                  <Input placeholder="New player name" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} className="bg-background border-border flex-1" onKeyDown={e => e.key === 'Enter' && handleAddNewPlayer()} />
                  <Button size="sm" onClick={handleAddNewPlayer} disabled={addPlayerMutation.isPending}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowNewPlayerInput(false); setNewPlayerName(""); }}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Label className="text-primary font-medium mb-3 block">🏆 Winning Team</Label>
              <div className="grid grid-cols-2 gap-3">
                {renderPlayerSelect(winningPlayer1, handlePlayerChange(setWinningPlayer1), "Player 1")}
                {renderPlayerSelect(winningPlayer2, handlePlayerChange(setWinningPlayer2), "Player 2")}
              </div>
              <div className="mt-3 space-y-2">
                <Label className="text-muted-foreground text-sm">Score</Label>
                <div className="flex items-center gap-3">
                  <Input type="number" placeholder="11" value={winningScore} onChange={e => handleWinningScoreChange(e.target.value)} className="bg-muted border-border w-20" min={0} max={99} />
                  <Slider
                    value={[parseInt(winningScore) || 11]}
                    onValueChange={([v]) => handleWinningScoreSlider(v)}
                    min={0}
                    max={25}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-border" />
              <span className="px-3 text-xs text-muted-foreground">VS</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <Label className="text-destructive font-medium mb-3 block">Losing Team</Label>
              <div className="grid grid-cols-2 gap-3">
                {renderPlayerSelect(losingPlayer1, handlePlayerChange(setLosingPlayer1), "Player 1")}
                {renderPlayerSelect(losingPlayer2, handlePlayerChange(setLosingPlayer2), "Player 2")}
              </div>
              <div className="mt-3 space-y-2">
                <Label className="text-muted-foreground text-sm">Score</Label>
                <div className="flex items-center gap-3">
                  <Input type="number" value={losingScore} onChange={e => handleLosingScoreChange(e.target.value)} className="bg-muted border-border w-20" min={0} max={maxLosingScore} />
                  <Slider
                    value={[parseInt(losingScore) || 0]}
                    onValueChange={([v]) => handleLosingScoreSlider(v)}
                    min={0}
                    max={maxLosingScore}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {previewVictoryType && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Victory Type:</span>
                <VictoryTypeBadge victoryTypeId={previewVictoryType.id} showLabel />
              </div>
            )}

            {allPlayersSelected && (
              <MatchPreview team1={team1} team2={team2} onSwapTeams={handleSwapTeams} />
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

      <SeasonConfirmDialog
        open={showSeasonConfirm}
        onOpenChange={(open) => {
          setShowSeasonConfirm(open);
          if (!open) setPendingSubmit(false);
        }}
        date={date}
        onConfirm={handleSeasonConfirm}
      />
    </>
  );
};

export default GameEntryForm;
