import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gamesData } from "@/data/games";

const Standings = () => {
  const players = useMemo(() => {
    const uniquePlayers = [...new Set(gamesData.map(g => g.player))];
    
    const playerStats = uniquePlayers.map(player => {
      const games = gamesData
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
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Standings</h1>
          
          <Card className="bg-card/50 border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="text-foreground">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Rank</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Player</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">MMR</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">W</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">L</th>
                      <th className="text-left py-4 px-6 text-muted-foreground font-medium">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.rank} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            player.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                            player.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                            player.rank === 3 ? "bg-amber-600/20 text-amber-600" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {player.rank}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-foreground font-medium">{player.name}</td>
                        <td className="py-4 px-6 text-primary font-display text-lg">{player.mmr.toLocaleString()}</td>
                        <td className="py-4 px-6 text-muted-foreground">{player.wins}</td>
                        <td className="py-4 px-6 text-muted-foreground">{player.losses}</td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {player.wins + player.losses > 0 
                            ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(0) 
                            : 0}%
                        </td>
                      </tr>
                    ))}
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
