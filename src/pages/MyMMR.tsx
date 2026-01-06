import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Minus, Users, User, Loader2 } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { useSelectedPlayer } from "@/hooks/useSelectedPlayer";
import AllPlayersView from "@/components/AllPlayersView";
import PlayerComparisonView from "@/components/PlayerComparisonView";
import { format } from "date-fns";
import { GameRecord } from "@/data/games";

const ITEMS_PER_PAGE = 10;

const MyMMR = () => {
  const { data: allGames = [], isLoading: gamesLoading } = useGames();
  const { data: players = [], isLoading: playersLoading } = usePlayers();
  const { selectedPlayer, setSelectedPlayer } = useSelectedPlayer();
  
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Check if "All Players" is selected
  const showAllPlayers = selectedPlayer === "all";

  // Get single player's games for individual view
  const singlePlayerGames = useMemo(() => {
    if (!selectedPlayer || selectedPlayer === "all") return [];
    return allGames
      .filter(g => g.player === selectedPlayer)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.game - a.game;
      });
  }, [selectedPlayer, allGames]);

  // Calculate stats for single selected player
  const stats = useMemo(() => {
    if (!selectedPlayer || selectedPlayer === "all" || singlePlayerGames.length === 0) {
      return { currentMMR: 0, winRate: 0, gamesPlayed: 0 };
    }
    
    const currentMMR = singlePlayerGames[0]?.mmrAfter || 0;
    const wins = singlePlayerGames.filter(g => g.result === 'Winner').length;
    const winRate = Math.round((wins / singlePlayerGames.length) * 100);
    
    return {
      currentMMR,
      winRate,
      gamesPlayed: singlePlayerGames.length
    };
  }, [selectedPlayer, singlePlayerGames]);

  // Get teammate for each game
  const getTeammate = useCallback((game: GameRecord): string => {
    const sameGame = allGames.filter(
      g => g.date === game.date && g.game === game.game && g.result === game.result && g.player !== game.player
    );
    return sameGame.map(g => g.player).join(", ") || "N/A";
  }, [allGames]);

  // Get opponents for each game
  const getOpponents = useCallback((game: GameRecord): string => {
    const opponents = allGames.filter(
      g => g.date === game.date && g.game === game.game && g.result !== game.result
    );
    return opponents.map(g => g.player).join(", ") || "N/A";
  }, [allGames]);

  // Infinite scroll observer
  useEffect(() => {
    if (showAllPlayers || !selectedPlayer) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayCount < singlePlayerGames.length) {
          setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, singlePlayerGames.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, singlePlayerGames.length, showAllPlayers, selectedPlayer]);

  // Reset display count when player changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedPlayer]);

  const displayedMatches = singlePlayerGames.slice(0, displayCount);

  const isLoading = gamesLoading || playersLoading;

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
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">My MMR</h1>
          
          {/* Player Selector Dropdown */}
          <div className="mb-8">
            <Label className="text-muted-foreground mb-3 block">Select Your Player</Label>
            <Select 
              value={selectedPlayer || ""} 
              onValueChange={(value) => setSelectedPlayer(value || null)}
            >
              <SelectTrigger className="w-full max-w-xs bg-card border-border">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Choose a player..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="all">All Players Overview</SelectItem>
                {players.map(player => (
                  <SelectItem key={player} value={player}>{player}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlayer && selectedPlayer !== "all" && (
              <p className="text-sm text-muted-foreground mt-2">
                Your selection is saved and will persist across sessions
              </p>
            )}
          </div>

          {showAllPlayers ? (
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
                    
                    {displayCount < singlePlayerGames.length && (
                      <div ref={loadMoreRef} className="py-4 text-center text-muted-foreground">
                        Loading more matches...
                      </div>
                    )}
                    
                    {displayCount >= singlePlayerGames.length && singlePlayerGames.length > ITEMS_PER_PAGE && (
                      <div className="py-2 text-center text-muted-foreground text-sm">
                        Showing all {singlePlayerGames.length} matches
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
