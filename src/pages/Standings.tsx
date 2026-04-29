import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGames, getPlayerSeasonGamesCount } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { useSelectedPlayer } from "@/hooks/useSelectedPlayer";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, LineChart, Flame } from "lucide-react";
import { SeasonSelector } from "@/components/SeasonSelector";
import { RankBadge } from "@/components/RankBadge";
import { MmrDistributionChart } from "@/components/MmrDistributionChart";
import { AllPlayersRankChart } from "@/components/AllPlayersRankChart";
import { getCurrentSeason } from "@/lib/seasons";
import HeadToHead from "@/components/HeadToHead";
import PlayerComparisonView from "@/components/PlayerComparisonView";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";
import { PlayerProfileDialog } from "@/components/PlayerProfileDialog";
import { calculateStreaks } from "@/lib/streaks";
import { usePlayerLastNameMap } from "@/hooks/usePlayers";
import { formatNameByLookup } from "@/lib/playerNames";

type SortField = "rank" | "name" | "mmr" | "wins" | "losses" | "winPct" | "avgPoints" | "streak";
type SortDir = "asc" | "desc";

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

const Standings = () => {
  const currentSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<number | "all">(currentSeason.id);
  const { data: allGames = [], isLoading } = useGames(selectedSeason);
  const { data: allPlayers = [] } = usePlayers();
  const { selectedPlayer } = useSelectedPlayer();
  
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const { placementEnabled } = usePlacementEnabled();

  const [h2hPlayer1, setH2hPlayer1] = useState<string>("");
  const [h2hPlayer2, setH2hPlayer2] = useState<string>("");

  const [comparisonPlayers, setComparisonPlayers] = useState<string[]>([]);
  const [profilePlayer, setProfilePlayer] = useState<string | null>(null);

  const toggleComparisonPlayer = (player: string) => {
    setComparisonPlayers(prev => 
      prev.includes(player) 
        ? prev.filter(p => p !== player)
        : [...prev, player]
    );
  };

  const players = useMemo(() => {
    const uniquePlayers = [...new Set(allGames.map(g => g.player))];
    
    const playerStats = uniquePlayers.map(player => {
      const games = allGames
        .filter(g => g.player === player)
        .sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return b.game - a.game;
        });
      
      const currentMMR = games[0]?.mmrAfter || 2000;
      const wins = games.filter(g => g.result === 'Winner').length;
      const losses = games.filter(g => g.result === 'Loser').length;
      const gamesPlayed = games.length;
      
      let totalPoints = 0;
      let scoredGames = 0;
      
      games.forEach(g => {
        if (g.score) {
          const [wScore, lScore] = g.score.split('-').map(s => parseInt(s.trim()));
          if (!isNaN(wScore) && !isNaN(lScore)) {
            totalPoints += g.result === 'Winner' ? wScore : lScore;
            scoredGames++;
          }
        }
      });
      
      const avgPointsScored = scoredGames > 0 ? totalPoints / scoredGames : 0;
      const seasonGames = getPlayerSeasonGamesCount(player, allGames, currentSeason.id);
      const streaks = calculateStreaks(games);
      
      return {
        name: player,
        mmr: currentMMR,
        wins,
        losses,
        gamesPlayed,
        avgPointsScored,
        winPct: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
        isPlacement: placementEnabled && seasonGames < 10,
        streaks,
      };
    });
    
    const rankedByMmr = [...playerStats].sort((a, b) => b.mmr - a.mmr);
    const withRank = rankedByMmr.map((player, index) => ({ ...player, rank: index + 1 }));
    
    return withRank.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "rank":
        case "mmr":
          comparison = a.rank - b.rank;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "wins":
          comparison = b.wins - a.wins;
          break;
        case "losses":
          comparison = b.losses - a.losses;
          break;
        case "winPct":
          comparison = b.winPct - a.winPct;
          break;
        case "avgPoints":
          comparison = b.avgPointsScored - a.avgPointsScored;
          break;
        case "streak":
          const aStreak = a.streaks.currentWinStreak || -a.streaks.currentLoseStreak;
          const bStreak = b.streaks.currentWinStreak || -b.streaks.currentLoseStreak;
          comparison = bStreak - aStreak;
          break;
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [allGames, sortField, sortDir, currentSeason.id, placementEnabled]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  };

  const SortableHeader = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th 
      className={`text-left py-3 px-2 sm:px-4 text-muted-foreground font-medium whitespace-nowrap cursor-pointer hover:text-foreground transition-colors text-xs sm:text-sm ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
        <MobileBottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-20">
        <div className="container mx-auto px-4 max-w-full">
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur py-3 -mx-4 px-4 border-b border-border mb-8">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground leading-none">Stats</h1>
              <SeasonSelector 
                selectedSeason={selectedSeason} 
                onSeasonChange={setSelectedSeason} 
                className="ml-auto shrink-0"
                triggerClassName="w-[146px] h-9 text-sm"
              />
            </div>
          </div>

          {/* 1. Leaderboard Table */}
          <Card className="bg-card/50 border-border overflow-hidden mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 sm:px-4 text-muted-foreground font-medium whitespace-nowrap text-xs sm:text-sm sticky left-0 bg-card z-10">#</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-muted-foreground font-medium whitespace-nowrap text-xs sm:text-sm sticky left-8 sm:left-12 bg-card z-10">Player</th>
                      <SortableHeader field="mmr" className="w-16">MMR</SortableHeader>
                      <SortableHeader field="wins">W</SortableHeader>
                      <SortableHeader field="losses">L</SortableHeader>
                      <SortableHeader field="winPct">Win %</SortableHeader>
                      <SortableHeader field="avgPoints">Avg Pts</SortableHeader>
                      <SortableHeader field="streak">Streak</SortableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => {
                      const isHighlighted = selectedPlayer && selectedPlayer !== "all" && player.name === selectedPlayer;
                      
                      return (
                        <tr 
                          key={player.name} 
                          className={`border-b border-border last:border-0 transition-colors ${
                            isHighlighted 
                              ? 'bg-primary/10 hover:bg-primary/15' 
                              : 'hover:bg-muted/20'
                          }`}
                        >
                          <td className="py-3 px-2 sm:px-4 sticky left-0 bg-card z-10">
                            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              player.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                              player.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                              player.rank === 3 ? "bg-amber-600/20 text-amber-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {player.rank}
                            </span>
                          </td>
                          <td className={`py-3 px-2 sm:px-4 font-medium whitespace-nowrap text-sm sticky left-8 sm:left-12 bg-card z-10 ${
                            isHighlighted ? 'text-primary' : 'text-foreground'
                          }`}>
                            <button 
                              onClick={() => setProfilePlayer(player.name)}
                              className="hover:text-primary hover:underline transition-colors"
                            >
                              {player.name}
                            </button>
                            {isHighlighted && (
                              <span className="ml-1 text-xs text-primary/70">(You)</span>
                            )}
                          </td>
                          <td className="py-3 px-2 sm:px-4 whitespace-nowrap">
                            {player.isPlacement ? (
                              <span className="text-muted-foreground text-sm">Placing ({player.gamesPlayed}/10)</span>
                            ) : (
                              <RankBadge 
                                mmr={player.mmr} 
                                gamesPlayed={player.gamesPlayed}
                                showMmr={true}
                                size="sm"
                              />
                            )}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-muted-foreground whitespace-nowrap text-sm">{player.wins}</td>
                          <td className="py-3 px-2 sm:px-4 text-muted-foreground whitespace-nowrap text-sm">{player.losses}</td>
                          <td className="py-3 px-2 sm:px-4 text-muted-foreground whitespace-nowrap text-sm">
                            {player.winPct.toFixed(0)}%
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-muted-foreground whitespace-nowrap text-sm">
                            {player.avgPointsScored > 0 ? player.avgPointsScored.toFixed(1) : '—'}
                          </td>
                          <td className="py-3 px-2 sm:px-4 whitespace-nowrap text-sm">
                            {player.streaks.currentWinStreak > 0 ? (
                              <span className="text-primary font-medium flex items-center gap-0.5">
                                <Flame className="w-3 h-3" />
                                {player.streaks.currentWinStreak}W
                              </span>
                            ) : player.streaks.currentLoseStreak > 0 ? (
                              <span className="text-destructive font-medium">
                                {player.streaks.currentLoseStreak}L
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 2. Compare Multiple Players */}
          <Card className="bg-card/50 border-border mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary" />
                <CardTitle className="text-foreground">Compare Multiple Players</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                {allPlayers.map(player => (
                  <label key={player} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={comparisonPlayers.includes(player)}
                      onCheckedChange={() => toggleComparisonPlayer(player)}
                    />
                    <span 
                      className="text-sm"
                      style={{ color: PLAYER_COLORS[player] || '#888' }}
                    >
                      {player}
                    </span>
                  </label>
                ))}
              </div>
              
              {comparisonPlayers.length >= 2 ? (
                <PlayerComparisonView selectedPlayers={comparisonPlayers} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select at least 2 players to compare their MMR over time
                </p>
              )}
            </CardContent>
          </Card>

          {/* 3. Head-to-Head Section */}
          <div className="mb-8">
            <HeadToHead 
              player1={h2hPlayer1}
              player2={h2hPlayer2}
              onPlayer1Change={setH2hPlayer1}
              onPlayer2Change={setH2hPlayer2}
            />
          </div>

          {/* 4. All Players Rank Chart */}
          <AllPlayersRankChart 
            players={players}
            highlightedPlayer={selectedPlayer}
          />

          {/* 5. MMR Distribution Chart */}
          <MmrDistributionChart 
            players={players} 
            highlightedPlayer={selectedPlayer} 
          />
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
      
      <PlayerProfileDialog 
        playerName={profilePlayer}
        open={!!profilePlayer}
        onOpenChange={(open) => !open && setProfilePlayer(null)}
      />
    </main>
  );
};

export default Standings;
