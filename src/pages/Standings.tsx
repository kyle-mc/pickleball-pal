import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGames } from "@/hooks/useGames";
import { useSelectedPlayer } from "@/hooks/useSelectedPlayer";
import { Loader2 } from "lucide-react";

const Standings = () => {
  const { data: allGames = [], isLoading } = useGames();
  const { selectedPlayer } = useSelectedPlayer();

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
      
      return {
        name: player,
        mmr: currentMMR,
        wins,
        losses,
      };
    });
    
    return playerStats
      .sort((a, b) => b.mmr - a.mmr)
      .map((player, index) => ({ ...player, rank: index + 1 }));
  }, [allGames]);

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
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Standings</h1>
          
          <Card className="bg-card/50 border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="text-foreground">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-4 px-4 sm:px-6 text-muted-foreground font-medium whitespace-nowrap">Rank</th>
                      <th className="text-left py-4 px-4 sm:px-6 text-muted-foreground font-medium whitespace-nowrap">Player</th>
                      <th className="text-left py-4 px-4 sm:px-6 text-muted-foreground font-medium whitespace-nowrap">MMR</th>
                      <th className="text-left py-4 px-4 sm:px-6 text-muted-foreground font-medium whitespace-nowrap">W</th>
                      <th className="text-left py-4 px-4 sm:px-6 text-muted-foreground font-medium whitespace-nowrap">L</th>
                      <th className="text-left py-4 px-4 sm:px-6 text-muted-foreground font-medium whitespace-nowrap">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => {
                      const isHighlighted = selectedPlayer && selectedPlayer !== "all" && player.name === selectedPlayer;
                      
                      return (
                        <tr 
                          key={player.rank} 
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
                          <td className="py-4 px-4 sm:px-6 text-primary font-display text-lg whitespace-nowrap">
                            {player.mmr.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-muted-foreground whitespace-nowrap">{player.wins}</td>
                          <td className="py-4 px-4 sm:px-6 text-muted-foreground whitespace-nowrap">{player.losses}</td>
                          <td className="py-4 px-4 sm:px-6 text-muted-foreground whitespace-nowrap">
                            {player.wins + player.losses > 0 
                              ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(0) 
                              : 0}%
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
