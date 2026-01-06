import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GameRecord } from "@/data/games";
import { useGames, useNextGameNumber, getPlayerMMR, useAddGames } from "@/hooks/useGames";
import { usePlayers, useAddPlayer } from "@/hooks/usePlayers";

interface GameEntryFormProps {
  onGameAdded?: () => void;
}

const GameEntryForm = ({ onGameAdded }: GameEntryFormProps) => {
  const { toast } = useToast();
  const { data: allGames = [] } = useGames();
  const { data: players = [] } = usePlayers();
  const addGamesMutation = useAddGames();
  const addPlayerMutation = useAddPlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [team1Player1, setTeam1Player1] = useState("");
  const [team1Player2, setTeam1Player2] = useState("");
  const [team2Player1, setTeam2Player1] = useState("");
  const [team2Player2, setTeam2Player2] = useState("");
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  
  // New player input states
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showNewPlayerInput, setShowNewPlayerInput] = useState(false);

  // Get the next game number for the selected date
  const nextGameNumber = useNextGameNumber(date, allGames);

  const handleAddNewPlayer = async () => {
    const name = newPlayerName.trim();
    if (!name) {
      toast({
        title: "Invalid Name",
        description: "Please enter a player name.",
        variant: "destructive",
      });
      return;
    }

    if (players.includes(name)) {
      toast({
        title: "Player Exists",
        description: "This player already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addPlayerMutation.mutateAsync(name);
      toast({
        title: "Player Added!",
        description: `${name} has been added to the player list.`,
      });
      setNewPlayerName("");
      setShowNewPlayerInput(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
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
    const team1MMR = getPlayerMMR(team1Player1, allGames) + getPlayerMMR(team1Player2, allGames);
    const team2MMR = getPlayerMMR(team2Player1, allGames) + getPlayerMMR(team2Player2, allGames);
    const mmrDiff = team1MMR - team2MMR;

    // Simple MMR calculation (base 50, adjusted by diff)
    const baseChange = 50;
    const adjustedChange = Math.round(baseChange - (mmrDiff / 20));
    const mmrChange = Math.max(25, Math.min(75, adjustedChange));

    const newGames: GameRecord[] = [];
    const scoreString = `${t1Score}-${t2Score}`;

    // Team 1 records
    team1Players.forEach(player => {
      const mmrBefore = getPlayerMMR(player, allGames);
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
      const mmrBefore = getPlayerMMR(player, allGames);
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

    try {
      // Add any new players to the database first
      const allPlayersInGame = [...team1Players, ...team2Players];
      for (const player of allPlayersInGame) {
        if (!players.includes(player)) {
          await addPlayerMutation.mutateAsync(player);
        }
      }

      await addGamesMutation.mutateAsync(newGames);
      
      toast({
        title: "Game Added!",
        description: `Game ${nextGameNumber} has been recorded and saved.`,
      });

      // Reset form
      setTeam1Player1("");
      setTeam1Player2("");
      setTeam2Player1("");
      setTeam2Player2("");
      setTeam1Score("");
      setTeam2Score("");
      setIsOpen(false);
      
      onGameAdded?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save game. Please try again.",
        variant: "destructive",
      });
    }
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
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Add New Player Section */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            {showNewPlayerInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="New player name"
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  className="bg-background border-border flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleAddNewPlayer()}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNewPlayer}
                  disabled={addPlayerMutation.isPending}
                >
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setShowNewPlayerInput(false);
                    setNewPlayerName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNewPlayerInput(true)}
                className="w-full text-muted-foreground"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Player
              </Button>
            )}
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Label className="text-primary font-medium mb-3 block">Team 1</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={team1Player1} onValueChange={setTeam1Player1}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Player 1" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {getAvailablePlayers(team1Player1).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={team1Player2} onValueChange={setTeam1Player2}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Player 2" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
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
                <SelectContent className="bg-card border-border z-50">
                  {getAvailablePlayers(team2Player1).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={team2Player2} onValueChange={setTeam2Player2}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Player 2" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
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

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            variant="hero"
            disabled={addGamesMutation.isPending}
          >
            {addGamesMutation.isPending ? "Saving..." : "Record Game"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameEntryForm;
