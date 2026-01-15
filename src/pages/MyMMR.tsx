import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, TrendingDown, Minus, Users, User, Loader2, LineChart } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import { usePlayers } from "@/hooks/usePlayers";
import { useSelectedPlayer } from "@/hooks/useSelectedPlayer";
import { useRealtimeGames } from "@/hooks/useRealtime";
import AllPlayersView from "@/components/AllPlayersView";
import PlayerComparisonView from "@/components/PlayerComparisonView";
import HeadToHead from "@/components/HeadToHead";
import { format } from "date-fns";
import { GameRecord } from "@/data/games";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ITEMS_PER_PAGE = 10;

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

const MyMMR = () => {
  const { data: allGames = [], isLoading: gamesLoading } = useGames();
  const { data: players = [], isLoading: playersLoading } = usePlayers();
  const { selectedPlayer, setSelectedPlayer } = useSelectedPlayer();
  
  // Enable real-time updates
  useRealtimeGames();
  
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Multi-player comparison - expanded by default
  const [comparisonPlayers, setComparisonPlayers] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(true);
  
  // Head-to-head
  const [h2hPlayer1, setH2hPlayer1] = useState<string>("");
  const [h2hPlayer2, setH2hPlayer2] = useState<string>("");

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

  // Build MMR history for single player graph
  const singlePlayerMmrHistory = useMemo(() => {
    if (!selectedPlayer || selectedPlayer === "all") return [];
    
    const playerGames = allGames
      .filter(g => g.player === selectedPlayer)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.game - b.game;
      });

    return playerGames.map((game, index) => ({
      label: `${format(new Date(game.date), 'MMM d')} G${game.game}`,
      mmr: game.mmrAfter,
      index,
    }));
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

  // Toggle player in comparison list
  const toggleComparisonPlayer = (player: string) => {
    setComparisonPlayers(prev => 
      prev.includes(player) 
        ? prev.filter(p => p !== player)
        : [...prev, player]
    );
  };

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
            {/* Selection persists across sessions */}
          </div>

          {/* Head-to-Head Section */}
          <div className="mb-8">
            <HeadToHead 
              player1={h2hPlayer1}
              player2={h2hPlayer2}
              onPlayer1Change={setH2hPlayer1}
              onPlayer2Change={setH2hPlayer2}
            />
          </div>

          {/* Multi-Player Comparison Toggle */}
          <div className="mb-8 p-4 rounded-lg bg-card/50 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary" />
                <Label className="text-foreground font-medium">Compare Multiple Players</Label>
              </div>
              <button 
                onClick={() => setShowComparison(!showComparison)}
                className="text-sm text-primary hover:underline"
              >
                {showComparison ? "Hide" : "Show"} Comparison
              </button>
            </div>
            
            {showComparison && (
              <>
                <div className="flex flex-wrap gap-3 mb-4">
                  {players.map(player => (
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
                
                {comparisonPlayers.length >= 2 && (
                  <PlayerComparisonView selectedPlayers={comparisonPlayers} />
                )}
                
                {comparisonPlayers.length < 2 && (
                  <p className="text-sm text-muted-foreground">
                    Select at least 2 players to compare their MMR over time
                  </p>
                )}
              </>
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

              {/* MMR Line Graph */}
              {singlePlayerMmrHistory.length > 0 && (
                <Card className="bg-card/50 border-border mb-8">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-primary" />
                      MMR Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={singlePlayerMmrHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="label" 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 12 }}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="mmr"
                            name="MMR"
                            stroke={PLAYER_COLORS[selectedPlayer] || 'hsl(var(--primary))'}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
              
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
