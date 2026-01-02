import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { gamesData as initialGamesData, GameRecord } from "@/data/games";
import AllPlayersView from "@/components/AllPlayersView";
import PlayerComparisonView from "@/components/PlayerComparisonView";
import CreatePlayerDialog from "@/components/CreatePlayerDialog";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const ITEMS_PER_PAGE = 10;

const MyMMR = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [customPlayers, setCustomPlayers] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Combine game-data players with custom players
  const players = useMemo(() => {
    const gamePlayers = [...new Set(initialGamesData.map(g => g.player))];
    const allPlayers = [...new Set([...gamePlayers, ...customPlayers])];
    return allPlayers.sort();
  }, [customPlayers]);

  // Check if "All Players" is selected
  const showAllPlayers = selectedPlayers.includes("all");

  // Get combined games for selected players (for comparison mode)
  const playerGames = useMemo(() => {
    if (showAllPlayers || selectedPlayers.length === 0) return [];
    return initialGamesData
      .filter(g => selectedPlayers.includes(g.player))
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.game - a.game;
      });
  }, [selectedPlayers, showAllPlayers]);

  // Get single player's games for individual view
  const singlePlayerGames = useMemo(() => {
    if (selectedPlayers.length !== 1 || showAllPlayers) return [];
    return initialGamesData
      .filter(g => g.player === selectedPlayers[0])
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.game - a.game;
      });
  }, [selectedPlayers, showAllPlayers]);

  // Calculate stats for single selected player
  const stats = useMemo(() => {
    if (selectedPlayers.length !== 1 || showAllPlayers || singlePlayerGames.length === 0) {
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
  }, [selectedPlayers, singlePlayerGames, showAllPlayers]);

  // Get teammate for each game
  const getTeammate = useCallback((game: GameRecord): string => {
    const sameGame = initialGamesData.filter(
      g => g.date === game.date && g.game === game.game && g.result === game.result && g.player !== game.player
    );
    return sameGame.map(g => g.player).join(", ") || "N/A";
  }, []);

  // Get opponents for each game
  const getOpponents = useCallback((game: GameRecord): string => {
    const opponents = initialGamesData.filter(
      g => g.date === game.date && g.game === game.game && g.result !== game.result
    );
    return opponents.map(g => g.player).join(", ") || "N/A";
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (showAllPlayers || selectedPlayers.length > 1) return;
    
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
  }, [displayCount, singlePlayerGames.length, showAllPlayers, selectedPlayers.length]);

  // Reset display count when player changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedPlayers]);

  const displayedMatches = singlePlayerGames.slice(0, displayCount);

  // Handle player selection toggle
  const togglePlayer = (player: string) => {
    if (player === "all") {
      setSelectedPlayers(prev => prev.includes("all") ? [] : ["all"]);
    } else {
      setSelectedPlayers(prev => {
        const withoutAll = prev.filter(p => p !== "all");
        if (withoutAll.includes(player)) {
          return withoutAll.filter(p => p !== player);
        } else {
          return [...withoutAll, player];
        }
      });
    }
  };

  // Handle new player creation
  const handlePlayerCreated = (name: string) => {
    setCustomPlayers(prev => [...prev, name]);
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">My MMR</h1>
          
          {/* Player Selector with Multi-Select */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-muted-foreground">Select Players to Compare</Label>
              <CreatePlayerDialog 
                existingPlayers={players}
                onPlayerCreated={handlePlayerCreated}
              />
            </div>
            <Card className="bg-card/50 border-border p-4">
              <ScrollArea className="h-40">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div 
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      showAllPlayers ? 'bg-primary/20 border border-primary' : 'bg-muted/50 border border-transparent hover:bg-muted'
                    }`}
                    onClick={() => togglePlayer("all")}
                  >
                    <Checkbox 
                      checked={showAllPlayers}
                      onCheckedChange={() => togglePlayer("all")}
                      className="border-primary data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm font-medium text-foreground">All Players</span>
                  </div>
                  {players.map(player => (
                    <div 
                      key={player}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedPlayers.includes(player) && !showAllPlayers
                          ? 'bg-primary/20 border border-primary' 
                          : 'bg-muted/50 border border-transparent hover:bg-muted'
                      }`}
                      onClick={() => togglePlayer(player)}
                    >
                      <Checkbox 
                        checked={selectedPlayers.includes(player) && !showAllPlayers}
                        onCheckedChange={() => togglePlayer(player)}
                        disabled={showAllPlayers}
                        className="border-primary data-[state=checked]:bg-primary"
                      />
                      <span className="text-sm font-medium text-foreground">{player}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
            {selectedPlayers.length > 0 && !showAllPlayers && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedPlayers.length} player{selectedPlayers.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {showAllPlayers ? (
            <AllPlayersView />
          ) : selectedPlayers.length > 1 ? (
            <PlayerComparisonView selectedPlayers={selectedPlayers} />
          ) : selectedPlayers.length === 1 ? (
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
              Select one or more players to view and compare MMR stats
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default MyMMR;
