import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGames } from "@/hooks/useGames";
import { useSelectedPlayer } from "@/hooks/useSelectedPlayer";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { SeasonSelector } from "@/components/SeasonSelector";
import { RankBadge } from "@/components/RankBadge";
import { MmrDistributionChart } from "@/components/MmrDistributionChart";
import { getCurrentSeason } from "@/lib/seasons";

type SortField = "rank" | "name" | "mmr" | "wins" | "losses" | "winPct" | "avgPoints";
type SortDir = "asc" | "desc";

const Standings = () => {
  const currentSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<number | "all">(currentSeason.id);
  const { data: allGames = [], isLoading } = useGames(selectedSeason);
  const { selectedPlayer } = useSelectedPlayer();
  
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
      
      // Calculate average points scored
      // Parse scores from games where this player participated
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
      
      return {
        name: player,
        mmr: currentMMR,
        wins,
        losses,
        gamesPlayed,
        avgPointsScored,
        winPct: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      };
    });
    
    // First sort by MMR to get base rank
    const rankedByMmr = [...playerStats].sort((a, b) => b.mmr - a.mmr);
    const withRank = rankedByMmr.map((player, index) => ({ ...player, rank: index + 1 }));
    
    // Then apply user's sort
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
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [allGames, sortField, sortDir]);

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
      className={`text-left py-4 px-4 sm:px-6 text-muted-foreground font-medium whitespace-nowrap cursor-pointer hover:text-foreground transition-colors ${className}`}
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground">Standings</h1>
            <SeasonSelector 
              selectedSeason={selectedSeason} 
              onSeasonChange={setSelectedSeason} 
            />
          </div>

          {/* MMR Distribution Chart */}
          <MmrDistributionChart 
            players={players} 
            highlightedPlayer={selectedPlayer} 
          />
          
          <Card className="bg-card/50 border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="text-foreground">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <SortableHeader field="rank">Rank</SortableHeader>
                      <SortableHeader field="name">Player</SortableHeader>
                      <SortableHeader field="mmr">Rating</SortableHeader>
                      <SortableHeader field="wins">W</SortableHeader>
                      <SortableHeader field="losses">L</SortableHeader>
                      <SortableHeader field="winPct">Win %</SortableHeader>
                      <SortableHeader field="avgPoints">Avg Pts</SortableHeader>
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
                          <td className="py-4 px-4 sm:px-6">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              player.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                              player.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                              player.rank === 3 ? "bg-amber-600/20 text-amber-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {player.rank}
                            </span>
                          </td>
                          <td className={`py-4 px-4 sm:px-6 font-medium whitespace-nowrap ${
                            isHighlighted ? 'text-primary' : 'text-foreground'
                          }`}>
                            {player.name}
                            {isHighlighted && (
                              <span className="ml-2 text-xs text-primary/70">(You)</span>
                            )}
                          </td>
                          <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                            <RankBadge 
                              mmr={player.mmr} 
                              gamesPlayed={player.gamesPlayed}
                              showMmr={true}
                              size="sm"
                            />
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-muted-foreground whitespace-nowrap">{player.wins}</td>
                          <td className="py-4 px-4 sm:px-6 text-muted-foreground whitespace-nowrap">{player.losses}</td>
                          <td className="py-4 px-4 sm:px-6 text-muted-foreground whitespace-nowrap">
                            {player.winPct.toFixed(0)}%
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-muted-foreground whitespace-nowrap">
                            {player.avgPointsScored > 0 ? player.avgPointsScored.toFixed(1) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Standings;