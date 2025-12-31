import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Standings = () => {
  const players = [
    { rank: 1, name: "Alex Johnson", mmr: 4.8, wins: 89, losses: 12 },
    { rank: 2, name: "Sarah Chen", mmr: 4.6, wins: 76, losses: 18 },
    { rank: 3, name: "Mike Davis", mmr: 4.5, wins: 82, losses: 23 },
    { rank: 4, name: "Emily Wilson", mmr: 4.3, wins: 65, losses: 21 },
    { rank: 5, name: "James Brown", mmr: 4.2, wins: 58, losses: 19 },
    { rank: 6, name: "Lisa Martinez", mmr: 4.0, wins: 52, losses: 24 },
    { rank: 7, name: "David Lee", mmr: 3.9, wins: 48, losses: 22 },
    { rank: 8, name: "Rachel Kim", mmr: 3.8, wins: 45, losses: 25 },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
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
                        <td className="py-4 px-6 text-primary font-display text-lg">{player.mmr}</td>
                        <td className="py-4 px-6 text-muted-foreground">{player.wins}</td>
                        <td className="py-4 px-6 text-muted-foreground">{player.losses}</td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {((player.wins / (player.wins + player.losses)) * 100).toFixed(0)}%
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
