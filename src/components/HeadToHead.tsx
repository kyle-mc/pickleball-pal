import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { Loader2, Swords, Trophy, Target } from "lucide-react";

const PLAYER_COLORS: Record<string, string> = {
  "Kyle": "#22c55e",
  "Josiah": "#3b82f6",
  "Chris": "#f59e0b",
  "Corbin": "#ef4444",
  "Brandon": "#8b5cf6",
  "Braden": "#ec4899",
  "Hayden": "#06b6d4",
  "Maxx": "#f97316",
  "Jaden": "#84cc16",
};

interface HeadToHeadProps {
  player1: string;
  player2: string;
  onPlayer1Change: (player: string) => void;
  onPlayer2Change: (player: string) => void;
}

const HeadToHead = ({ player1, player2, onPlayer1Change, onPlayer2Change }: HeadToHeadProps) => {
  const { data: allGames = [], isLoading } = useGames();
  const { data: players = [] } = usePlayers();

  const matchupStats = useMemo(() => {
    if (!player1 || !player2 || player1 === player2) {
      return null;
    }

    // Find games where both players participated
    const gamesByDateAndNumber = allGames.reduce((acc, game) => {
      const key = `${game.date}-${game.game}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(game);
      return acc;
    }, {} as Record<string, typeof allGames>);

    let p1Wins = 0;
    let p2Wins = 0;
    let p1PointsFor = 0;
    let p2PointsFor = 0;

    Object.values(gamesByDateAndNumber).forEach(gameRecords => {
      const p1Record = gameRecords.find(g => g.player === player1);
      const p2Record = gameRecords.find(g => g.player === player2);

      if (p1Record && p2Record) {
        // They were on opposite teams
        if (p1Record.result !== p2Record.result) {
          if (p1Record.result === 'Winner') {
            p1Wins++;
          } else {
            p2Wins++;
          }

          // Parse score
          const score = p1Record.score || '';
          const scoreParts = score.split('-').map(s => parseInt(s.trim()));
          if (scoreParts.length === 2 && !isNaN(scoreParts[0]) && !isNaN(scoreParts[1])) {
            if (p1Record.result === 'Winner') {
              p1PointsFor += scoreParts[0];
              p2PointsFor += scoreParts[1];
            } else {
              p1PointsFor += scoreParts[1];
              p2PointsFor += scoreParts[0];
            }
          }
        }
      }
    });

    return {
      p1Wins,
      p2Wins,
      p1PointsFor,
      p2PointsFor,
      totalGames: p1Wins + p2Wins,
    };
  }, [player1, player2, allGames]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Pickleball court background pattern */}
        <div className="relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 border-4 border-primary m-8" />
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-primary -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary -translate-x-1/2" />
          </div>

          <div className="relative p-6">
            {/* Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full">
                <Swords className="w-5 h-5 text-primary" />
                <span className="font-display text-lg text-primary">HEAD TO HEAD</span>
                <Swords className="w-5 h-5 text-primary transform scale-x-[-1]" />
              </div>
            </div>

            {/* Player Selection */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
              <Select value={player1} onValueChange={onPlayer1Change}>
                <SelectTrigger className="bg-muted/50 border-primary/30 text-center">
                  <SelectValue placeholder="Select Player 1" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {players.filter(p => p !== player2).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-2xl font-display text-accent">VS</div>

              <Select value={player2} onValueChange={onPlayer2Change}>
                <SelectTrigger className="bg-muted/50 border-destructive/30 text-center">
                  <SelectValue placeholder="Select Player 2" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  {players.filter(p => p !== player1).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Versus Display */}
            {player1 && player2 && player1 !== player2 && matchupStats && (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                {/* Player 1 */}
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-display mb-3 shadow-lg"
                    style={{ 
                      backgroundColor: `${PLAYER_COLORS[player1] || '#888'}20`,
                      border: `3px solid ${PLAYER_COLORS[player1] || '#888'}`,
                      boxShadow: `0 0 20px ${PLAYER_COLORS[player1] || '#888'}40`
                    }}
                  >
                    {player1.charAt(0)}
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-2">{player1}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-display text-primary">{matchupStats.p1Wins}</span>
                      <span className="text-muted-foreground text-sm">wins</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="text-lg font-medium text-foreground">{matchupStats.p1PointsFor}</span>
                      <span className="text-muted-foreground text-sm">pts</span>
                    </div>
                  </div>
                </div>

                {/* Center divider */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center animate-pulse-glow">
                    <span className="text-2xl">🏓</span>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Games Played</div>
                    <div className="text-lg font-display text-foreground">{matchupStats.totalGames}</div>
                  </div>
                </div>

                {/* Player 2 */}
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-display mb-3 shadow-lg"
                    style={{ 
                      backgroundColor: `${PLAYER_COLORS[player2] || '#888'}20`,
                      border: `3px solid ${PLAYER_COLORS[player2] || '#888'}`,
                      boxShadow: `0 0 20px ${PLAYER_COLORS[player2] || '#888'}40`
                    }}
                  >
                    {player2.charAt(0)}
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-2">{player2}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-2xl font-display text-primary">{matchupStats.p2Wins}</span>
                      <span className="text-muted-foreground text-sm">wins</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="text-lg font-medium text-foreground">{matchupStats.p2PointsFor}</span>
                      <span className="text-muted-foreground text-sm">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(!player1 || !player2 || player1 === player2) && (
              <div className="text-center py-8 text-muted-foreground">
                Select two different players to see their head-to-head record
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeadToHead;
