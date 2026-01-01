import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, MapPin, Users } from "lucide-react";
import { gamesData, GameRecord } from "@/data/games";
import AllPlayersView from "@/components/AllPlayersView";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const MyMMR = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get unique player names
  const players = useMemo(() => {
    const uniquePlayers = [...new Set(gamesData.map(g => g.player))];
    return uniquePlayers.sort();
  }, []);

  // Get player's games sorted by date and game number (most recent first)
  const playerGames = useMemo(() => {
    if (!selectedPlayer || selectedPlayer === "all") return [];
    return gamesData
      .filter(g => g.player === selectedPlayer)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.game - a.game;
      });
  }, [selectedPlayer]);

  // Calculate stats for selected player
  const stats = useMemo(() => {
    if (!selectedPlayer || selectedPlayer === "all" || playerGames.length === 0) {
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

  // Get teammate for each game
  const getTeammate = useCallback((game: GameRecord): string => {
    const sameGame = gamesData.filter(
      g => g.date === game.date && g.game === game.game && g.result === game.result && g.player !== game.player
    );
    return sameGame.map(g => g.player).join(", ") || "N/A";
  }, []);

  // Get opponents for each game
  const getOpponents = useCallback((game: GameRecord): string => {
    const opponents = gamesData.filter(
      g => g.date === game.date && g.game === game.game && g.result !== game.result
    );
    return opponents.map(g => g.player).join(", ") || "N/A";
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (selectedPlayer === "all") return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayCount < playerGames.length) {
          setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, playerGames.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, playerGames.length, selectedPlayer]);

  // Reset display count when player changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedPlayer]);

  const displayedMatches = playerGames.slice(0, displayCount);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">My MMR</h1>
          
          {/* Player Selector */}
          <div className="mb-8">
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="w-full md:w-64 bg-card border-border">
                <SelectValue placeholder="Select a player" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Players</SelectItem>
                {players.map(player => (
                  <SelectItem key={player} value={player}>
                    {player}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlayer === "all" ? (
            <AllPlayersView />
          ) : selectedPlayer ? (
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
                  <CardTitle className="text-foreground">All Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayedMatches.map((match, i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              match.result === "Winner" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                            }`}>
                              {match.result === "Winner" ? "W" : "L"}
                            </span>
                            <div>
                              <div className="font-medium text-foreground">
                                Game {match.game}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(match.date), "MMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div>
                              <div className="text-muted-foreground">Score</div>
                              <div className="text-foreground font-medium">{match.score || "—"}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" /> Partner
                              </div>
                              <div className="text-foreground">{getTeammate(match)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">vs</div>
                              <div className="text-foreground">{getOpponents(match)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-muted-foreground">MMR Change</div>
                              <div className="flex items-center gap-1 justify-end">
                                {match.mmrChange > 0 ? (
                                  <TrendingUp className="w-4 h-4 text-primary" />
                                ) : match.mmrChange < 0 ? (
                                  <TrendingDown className="w-4 h-4 text-destructive" />
                                ) : (
                                  <Minus className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className={`font-medium ${match.mmrChange > 0 ? "text-primary" : match.mmrChange < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                  {match.mmrChange > 0 ? "+" : ""}{match.mmrChange}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {displayCount < playerGames.length && (
                      <div ref={loadMoreRef} className="py-4 text-center text-muted-foreground">
                        Loading more matches...
                      </div>
                    )}
                    
                    {displayCount >= playerGames.length && playerGames.length > ITEMS_PER_PAGE && (
                      <div className="py-2 text-center text-muted-foreground text-sm">
                        Showing all {playerGames.length} matches
                      </div>
                    )}
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
