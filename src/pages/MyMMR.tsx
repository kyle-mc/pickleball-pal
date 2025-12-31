import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { gamesData, GameRecord } from "@/data/games";

const MyMMR = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  // Get unique player names
  const players = useMemo(() => {
    const uniquePlayers = [...new Set(gamesData.map(g => g.player))];
    return uniquePlayers.sort();
  }, []);

  // Get player's games sorted by date and game number (most recent first)
  const playerGames = useMemo(() => {
    if (!selectedPlayer) return [];
    return gamesData
      .filter(g => g.player === selectedPlayer)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.game - a.game;
      });
  }, [selectedPlayer]);

  // Get last 4 matches for the selected player
  const recentMatches = playerGames.slice(0, 4);

  // Calculate stats for selected player
  const stats = useMemo(() => {
    if (!selectedPlayer || playerGames.length === 0) {
      return { currentMMR: 0, winRate: 0, gamesPlayed: 0 };
    }
    
    const currentMMR = playerGames[0]?.mmrAfter || 0;
    const wins = playerGames.filter(g => g.result === 'Winner').length;
    const winRate = Math.round((wins / playerGames.length) * 100);
    
    return {
      currentMMR,
      winRate,
      gamesPlayed: playerGames.length
    };
  }, [selectedPlayer, playerGames]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">My MMR</h1>
          
          {/* Player Selector */}
          <div className="mb-8">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-full md:w-64 bg-card border-border">
                <SelectValue placeholder="Select a player" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {players.map(player => (
                  <SelectItem key={player} value={player}>
                    {player}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPlayer ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Current MMR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-display text-foreground">{stats.currentMMR}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-4xl font-display text-foreground">{stats.winRate}%</span>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">Games Played</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-4xl font-display text-foreground">{stats.gamesPlayed}</span>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentMatches.map((match, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            match.result === "Winner" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                          }`}>
                            {match.result === "Winner" ? "W" : "L"}
                          </span>
                          <span className="text-muted-foreground">Game {match.game} • {match.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {match.mmrChange > 0 ? (
                            <TrendingUp className="w-4 h-4 text-primary" />
                          ) : match.mmrChange < 0 ? (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          ) : (
                            <Minus className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className={match.mmrChange > 0 ? "text-primary" : match.mmrChange < 0 ? "text-destructive" : "text-muted-foreground"}>
                            {match.mmrChange > 0 ? "+" : ""}{match.mmrChange}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a player to view their MMR stats
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default MyMMR;
