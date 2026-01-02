import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { gamesData, GameRecord } from "@/data/games";

interface GameEntryFormProps {
  players: string[];
  onGameAdded: (games: GameRecord[]) => void;
}

const GameEntryForm = ({ players, onGameAdded }: GameEntryFormProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [team1Player1, setTeam1Player1] = useState("");
  const [team1Player2, setTeam1Player2] = useState("");
  const [team2Player1, setTeam2Player1] = useState("");
  const [team2Player2, setTeam2Player2] = useState("");
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");

  // Get the next game number for the selected date
  const nextGameNumber = useMemo(() => {
    const gamesOnDate = gamesData.filter(g => g.date === date);
    if (gamesOnDate.length === 0) return 1;
    return Math.max(...gamesOnDate.map(g => g.game)) + 1;
  }, [date]);

  // Get current MMR for a player
  const getPlayerMMR = (player: string): number => {
    const playerGames = gamesData
      .filter(g => g.player === player)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.game - a.game;
      });
    return playerGames[0]?.mmrAfter || 2000;
  };

  const handleSubmit = () => {
    // Validate
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
      toast({
        title: "Missing Players",
        description: "Please select all 4 players.",
        variant: "destructive",
      });
      return;
    }

    if (!team1Score || !team2Score) {
      toast({
        title: "Missing Scores",
        description: "Please enter scores for both teams.",
        variant: "destructive",
      });
      return;
    }

    const t1Score = parseInt(team1Score);
    const t2Score = parseInt(team2Score);

    if (t1Score === t2Score) {
      toast({
        title: "Invalid Scores",
        description: "Scores cannot be tied.",
        variant: "destructive",
      });
      return;
    }

    const team1Wins = t1Score > t2Score;
    const team1Players = [team1Player1, team1Player2];
    const team2Players = [team2Player1, team2Player2];

    // Calculate MMRs
    const team1MMR = getPlayerMMR(team1Player1) + getPlayerMMR(team1Player2);
    const team2MMR = getPlayerMMR(team2Player1) + getPlayerMMR(team2Player2);
    const mmrDiff = team1MMR - team2MMR;

    // Simple MMR calculation (base 50, adjusted by diff)
    const baseChange = 50;
    const adjustedChange = Math.round(baseChange - (mmrDiff / 20));
    const mmrChange = Math.max(25, Math.min(75, adjustedChange));

    const newGames: GameRecord[] = [];
    const scoreString = `${t1Score}-${t2Score}`;

    // Team 1 records
    team1Players.forEach(player => {
      const mmrBefore = getPlayerMMR(player);
      newGames.push({
        game: nextGameNumber,
        result: team1Wins ? 'Winner' : 'Loser',
        player,
        score: scoreString,
        mmrBefore,
        teamMmr: team1MMR,
        teamMmrDiff: mmrDiff,
        mmrAfter: mmrBefore + (team1Wins ? mmrChange : -mmrChange),
        mmrChange: team1Wins ? mmrChange : -mmrChange,
        date,
      });
    });

    // Team 2 records
    team2Players.forEach(player => {
      const mmrBefore = getPlayerMMR(player);
      newGames.push({
        game: nextGameNumber,
        result: team1Wins ? 'Loser' : 'Winner',
        player,
        score: scoreString,
        mmrBefore,
        teamMmr: team2MMR,
        teamMmrDiff: -mmrDiff,
        mmrAfter: mmrBefore + (team1Wins ? -mmrChange : mmrChange),
        mmrChange: team1Wins ? -mmrChange : mmrChange,
        date,
      });
    });

    onGameAdded(newGames);
    
    toast({
      title: "Game Added!",
      description: `Game ${nextGameNumber} has been recorded.`,
    });

    // Reset form
    setTeam1Player1("");
    setTeam1Player2("");
    setTeam2Player1("");
    setTeam2Player2("");
    setTeam1Score("");
    setTeam2Score("");
    setIsOpen(false);
  };

  const selectedPlayers = [team1Player1, team1Player2, team2Player1, team2Player2].filter(Boolean);

  const getAvailablePlayers = (currentValue: string) => {
    return players.filter(p => !selectedPlayers.includes(p) || p === currentValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="w-4 h-4 mr-2" />
          Add Game
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Record New Game</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-muted-foreground">Date</Label>
            <Input 
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-muted border-border"
            />
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Label className="text-primary font-medium mb-3 block">Team 1</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={team1Player1} onValueChange={setTeam1Player1}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Player 1" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {getAvailablePlayers(team1Player1).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={team1Player2} onValueChange={setTeam1Player2}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Player 2" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {getAvailablePlayers(team1Player2).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              <Label className="text-muted-foreground text-sm">Score</Label>
              <Input 
                type="number"
                placeholder="11"
                value={team1Score}
                onChange={e => setTeam1Score(e.target.value)}
                className="bg-muted border-border w-24"
              />
            </div>
          </div>

          <div className="text-center text-muted-foreground font-medium">VS</div>

          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <Label className="text-destructive font-medium mb-3 block">Team 2</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={team2Player1} onValueChange={setTeam2Player1}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Player 1" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {getAvailablePlayers(team2Player1).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={team2Player2} onValueChange={setTeam2Player2}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Player 2" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {getAvailablePlayers(team2Player2).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              <Label className="text-muted-foreground text-sm">Score</Label>
              <Input 
                type="number"
                placeholder="9"
                value={team2Score}
                onChange={e => setTeam2Score(e.target.value)}
                className="bg-muted border-border w-24"
              />
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full" variant="hero">
            Record Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameEntryForm;
