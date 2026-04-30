import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGames } from "@/hooks/useGames";
import { usePlayers, usePlayerLastNameMap } from "@/hooks/usePlayers";
import { formatNameByLookup } from "@/lib/playerNames";
import { Swords, Gamepad2 } from "lucide-react";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";

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
  const lastNameMap = usePlayerLastNameMap();
  const navigate = useNavigate();

  const matchupStats = useMemo(() => {
    if (!player1 || !player2 || player1 === player2) return null;

    const gamesByDateAndNumber = allGames.reduce((acc, game) => {
      const key = `${game.date}-${game.game}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(game);
      return acc;
    }, {} as Record<string, typeof allGames>);

    let p1Wins = 0, p2Wins = 0, p1PointsFor = 0, p2PointsFor = 0, p1PointsAgainst = 0, p2PointsAgainst = 0;
    let p1NetMmr = 0, p2NetMmr = 0;
    const p1VictoryTypes: Record<string, number> = {};
    const p2VictoryTypes: Record<string, number> = {};

    Object.values(gamesByDateAndNumber).forEach(gameRecords => {
      const p1Record = gameRecords.find(g => g.player === player1);
      const p2Record = gameRecords.find(g => g.player === player2);
      if (p1Record && p2Record && p1Record.result !== p2Record.result) {
        if (p1Record.result === 'Winner') {
          p1Wins++;
          const vt = p1Record.victoryType || 'standard';
          p1VictoryTypes[vt] = (p1VictoryTypes[vt] || 0) + 1;
        } else {
          p2Wins++;
          const vt = p2Record.victoryType || 'standard';
          p2VictoryTypes[vt] = (p2VictoryTypes[vt] || 0) + 1;
        }
        // Each player's net MMR from games against each other
        p1NetMmr += p1Record.mmrChange;
        p2NetMmr += p2Record.mmrChange;
        
        const score = p1Record.score || p2Record.score || '';
        const scoreParts = score.split('-').map(s => parseInt(s.trim()));
        if (scoreParts.length === 2 && !isNaN(scoreParts[0]) && !isNaN(scoreParts[1])) {
          const winScore = scoreParts[0];
          const loseScore = scoreParts[1];
          if (p1Record.result === 'Winner') {
            p1PointsFor += winScore;
            p1PointsAgainst += loseScore;
            p2PointsFor += loseScore;
            p2PointsAgainst += winScore;
          } else {
            p1PointsFor += loseScore;
            p1PointsAgainst += winScore;
            p2PointsFor += winScore;
            p2PointsAgainst += loseScore;
          }
        }
      }
    });

    const totalGames = p1Wins + p2Wins;
    return {
      p1Wins, p2Wins, totalGames,
      p1PointsFor, p2PointsFor, p1PointsAgainst, p2PointsAgainst,
      p1NetMmr, p2NetMmr,
      p1WinPct: totalGames > 0 ? Math.round((p1Wins / totalGames) * 100) : 0,
      p2WinPct: totalGames > 0 ? Math.round((p2Wins / totalGames) * 100) : 0,
      p1VictoryTypes, p2VictoryTypes,
    };
  }, [player1, player2, allGames]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><span className="text-muted-foreground">Loading...</span></div>;
  }

  const renderMmrImpact = (value: number) => (
    <span className={`font-medium ${value > 0 ? 'text-primary' : value < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
      {value > 0 ? '+' : ''}{value}
    </span>
  );

  const renderVictoryTypes = (vtCounts: Record<string, number>) => {
    const entries = Object.entries(vtCounts).filter(([, count]) => count > 0);
    if (entries.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {entries.map(([vtId, count]) => (
          <span key={vtId} className="inline-flex items-center gap-0.5 text-xs">
            <VictoryTypeBadge victoryTypeId={vtId} size="sm" />
            <span className="text-muted-foreground">×{count}</span>
          </span>
        ))}
      </div>
    );
  };

  const handleViewGames = () => {
    navigate(`/games?players=${encodeURIComponent(player1)},${encodeURIComponent(player2)}`);
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 border-4 border-primary m-8" />
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-primary -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary -translate-x-1/2" />
          </div>

          <div className="relative p-6">
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
                    <SelectItem key={p} value={p}>{formatNameByLookup(p, lastNameMap)}</SelectItem>
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
                    <SelectItem key={p} value={p}>{formatNameByLookup(p, lastNameMap)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {player1 && player2 && player1 !== player2 && matchupStats && (
              <>
                {/* Main stats grid */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6">
                  {/* Player 1 */}
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-display mb-3 shadow-lg"
                      style={{ backgroundColor: `${PLAYER_COLORS[player1] || '#888'}20`, border: `3px solid ${PLAYER_COLORS[player1] || '#888'}`, boxShadow: `0 0 20px ${PLAYER_COLORS[player1] || '#888'}40` }}>
                      {player1.charAt(0)}
                    </div>
                    <h3 className="font-display text-xl text-foreground mb-1">{player1}</h3>
                    <div className="text-2xl font-display text-foreground mb-1">
                      {matchupStats.p1Wins}-{matchupStats.p2Wins}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {matchupStats.p1WinPct}% Win Rate
                    </div>
                  </div>
                  
                  {/* Center stats */}
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <div className="text-center">
                      <div className="text-3xl font-display text-foreground">{matchupStats.totalGames}</div>
                      <div className="text-xs text-muted-foreground">Games</div>
                    </div>
                  </div>
                  
                  {/* Player 2 */}
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-display mb-3 shadow-lg"
                      style={{ backgroundColor: `${PLAYER_COLORS[player2] || '#888'}20`, border: `3px solid ${PLAYER_COLORS[player2] || '#888'}`, boxShadow: `0 0 20px ${PLAYER_COLORS[player2] || '#888'}40` }}>
                      {player2.charAt(0)}
                    </div>
                    <h3 className="font-display text-xl text-foreground mb-1">{player2}</h3>
                    <div className="text-2xl font-display text-foreground mb-1">
                      {matchupStats.p2Wins}-{matchupStats.p1Wins}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {matchupStats.p2WinPct}% Win Rate
                    </div>
                  </div>
                </div>

                {matchupStats.totalGames > 0 && (
                  <>
                    {/* Detailed Stats */}
                    <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm font-medium text-foreground">{matchupStats.p1PointsFor}-{matchupStats.p1PointsAgainst}</div>
                          <div className="text-xs text-muted-foreground">PF-PA</div>
                          <div className="text-xs text-muted-foreground mt-1">{matchupStats.p1WinPct}% W</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-medium mb-1">Net MMR</div>
                          <div className="flex flex-col items-center gap-1 text-xs">
                            <span>{player1}: {renderMmrImpact(matchupStats.p1NetMmr)}</span>
                            <span>{player2}: {renderMmrImpact(matchupStats.p2NetMmr)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{matchupStats.p2PointsFor}-{matchupStats.p2PointsAgainst}</div>
                          <div className="text-xs text-muted-foreground">PF-PA</div>
                          <div className="text-xs text-muted-foreground mt-1">{matchupStats.p2WinPct}% W</div>
                        </div>
                      </div>
                    </div>

                    {/* Victory Types */}
                    <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="text-center text-xs font-medium text-muted-foreground mb-3">Victory Types Won</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">{player1}</div>
                          {renderVictoryTypes(matchupStats.p1VictoryTypes)}
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">{player2}</div>
                          {renderVictoryTypes(matchupStats.p2VictoryTypes)}
                        </div>
                      </div>
                    </div>

                    {/* View Games shortcut */}
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm" onClick={handleViewGames} className="gap-2">
                        <Gamepad2 className="w-4 h-4" />
                        View Head-to-Head Games
                      </Button>
                    </div>
                  </>
                )}
              </>
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
