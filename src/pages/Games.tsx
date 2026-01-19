import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGames, getPlayerSeasonGamesCount } from "@/hooks/useGames";
import { useRealtimeGames } from "@/hooks/useRealtime";
import { useGameVideos } from "@/hooks/useVideos";
import GameEntryForm from "@/components/GameEntryForm";
import DataExportPanel from "@/components/DataExportPanel";
import { SeasonSelector } from "@/components/SeasonSelector";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { MmrChangeTooltip } from "@/components/MmrChangeTooltip";
import { AddVideoDialog } from "@/components/AddVideoDialog";
import { VICTORY_TYPES } from "@/lib/victoryTypes";
import { format, parseISO } from "date-fns";
import { Filter, ArrowUpDown, Loader2, Video, Plus } from "lucide-react";
import { getCurrentSeason } from "@/lib/seasons";

type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 5;

const Games = () => {
  const navigate = useNavigate();
  const currentSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<number | "all">(currentSeason.id);
  const { data: allGames = [], isLoading } = useGames(selectedSeason);
  useRealtimeGames();
  const { hasVideoForGame, getVideoForGame } = useGameVideos();
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [victoryTypeFilter, setVictoryTypeFilter] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // State for add video dialog
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [selectedGameForVideo, setSelectedGameForVideo] = useState<string | undefined>(undefined);

  // Get unique dates for filtering - fix timezone issue by parsing as local date
  const uniqueDates = useMemo(() => 
    [...new Set(allGames.map(g => g.date))].sort((a, b) => 
      new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()
    ), [allGames]);

  // Get unique players for filtering
  const uniquePlayers = useMemo(() => 
    [...new Set(allGames.map(g => g.player))].sort(), [allGames]);

  // Get player games count cache for unranked check
  const playerGamesCount = useMemo(() => {
    const counts: Record<string, number> = {};
    const season = selectedSeason === "all" ? currentSeason.id : selectedSeason;
    uniquePlayers.forEach(player => {
      counts[player] = getPlayerSeasonGamesCount(player, allGames, season);
    });
    return counts;
  }, [allGames, uniquePlayers, selectedSeason, currentSeason.id]);

  // Filter games by date, player, and victory type
  const filteredGames = useMemo(() => {
    let games = [...allGames];
    
    if (selectedDate) {
      games = games.filter(g => g.date === selectedDate);
    }
    
    if (playerFilter !== "all") {
      const playerGameKeys = new Set(
        games
          .filter(g => g.player === playerFilter)
          .map(g => `${g.date}-${g.game}`)
      );
      games = games.filter(g => playerGameKeys.has(`${g.date}-${g.game}`));
    }

    if (victoryTypeFilter !== "all") {
      games = games.filter(g => g.victoryType === victoryTypeFilter);
    }
    
    return games;
  }, [selectedDate, playerFilter, victoryTypeFilter, allGames]);

  // Group by date, then by game number
  const groupedByDate = useMemo(() => {
    const grouped = filteredGames.reduce((acc, game) => {
      if (!acc[game.date]) acc[game.date] = {};
      if (!acc[game.date][game.game]) acc[game.date][game.game] = [];
      acc[game.date][game.game].push(game);
      return acc;
    }, {} as Record<string, Record<number, typeof allGames>>);
    
    return grouped;
  }, [filteredGames]);

  const sortedDates = useMemo(() => {
    const dates = Object.keys(groupedByDate);
    return dates.sort((a, b) => {
      if (sortDirection === "desc") {
        return new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
      }
      return new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime();
    });
  }, [groupedByDate, sortDirection]);

  const displayedDates = sortedDates.slice(0, displayCount);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayCount < sortedDates.length) {
          setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedDates.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, sortedDates.length]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedDate, playerFilter, victoryTypeFilter, sortDirection]);

  const toggleSort = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
  };

  const handleAddVideo = (gameId: string) => {
    setSelectedGameForVideo(gameId);
    setIsAddVideoOpen(true);
  };

  const handleWatchVideo = (videoId: string) => {
    navigate(`/videos?play=${videoId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-display text-foreground mb-2">Games</h1>
            <p className="text-muted-foreground">All pickleball games and MMR changes</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <DataExportPanel />
            <GameEntryForm />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <SeasonSelector 
            selectedSeason={selectedSeason} 
            onSeasonChange={setSelectedSeason} 
          />

          <Select value={playerFilter} onValueChange={setPlayerFilter}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by player" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="all">All Players</SelectItem>
              {uniquePlayers.map(player => (
                <SelectItem key={player} value={player}>{player}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={victoryTypeFilter} onValueChange={setVictoryTypeFilter}>
            <SelectTrigger className="w-[200px] bg-card border-border">
              <SelectValue placeholder="Victory Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="all">All Victory Types</SelectItem>
              {Object.values(VICTORY_TYPES).map(vt => (
                <SelectItem key={vt.id} value={vt.id}>
                  <span className="flex items-center gap-2">
                    <span>{vt.emoji}</span>
                    <span>{vt.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            onClick={toggleSort}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortDirection === "desc" ? "Newest First" : "Oldest First"}
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSelectedDate(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDate === null 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Dates
          </button>
          {uniqueDates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDate === date 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {format(parseISO(date), 'MMM d, yyyy')}
            </button>
          ))}
        </div>

        {/* Games by Date */}
        <div className="space-y-8">
          {displayedDates.map(date => (
            <div key={date}>
              <h2 className="text-2xl font-display text-foreground mb-4">
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </h2>
              <div className="grid gap-4">
                {Object.entries(groupedByDate[date])
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([gameNum, players]) => {
                    const winners = players.filter(p => p.result === 'Winner');
                    const losers = players.filter(p => p.result === 'Loser');
                    const score = players[0]?.score;
                    const victoryType = players[0]?.victoryType;
                    const gameKey = `${date}-${gameNum}`;
                    const video = getVideoForGame(gameKey);
                    const hasVideo = hasVideoForGame(gameKey);
                    
                    return (
                      <Card key={gameNum} className="bg-card border-border overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center gap-3 flex-wrap">
                            <span>Game {gameNum}</span>
                            {score && <span className="text-muted-foreground text-sm font-normal">({score})</span>}
                            {victoryType && <VictoryTypeBadge victoryTypeId={victoryType} size="sm" />}
                            
                            {/* Video actions */}
                            <div className="ml-auto flex items-center gap-2">
                              {hasVideo && video ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                        onClick={() => handleWatchVideo(video.id)}
                                      >
                                        <Video className="w-4 h-4 mr-1" />
                                        Watch
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Watch video highlight</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => handleAddVideo(gameKey)}
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        <Video className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add video for this game</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border">
                                <TableHead className="text-muted-foreground whitespace-nowrap">Result</TableHead>
                                <TableHead className="text-muted-foreground whitespace-nowrap">Player</TableHead>
                                <TableHead className="text-muted-foreground text-right whitespace-nowrap">MMR Before</TableHead>
                                <TableHead className="text-muted-foreground text-right whitespace-nowrap">MMR After</TableHead>
                                <TableHead className="text-muted-foreground text-right whitespace-nowrap">Change</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...winners, ...losers].map((player, idx) => {
                                const isUnranked = playerGamesCount[player.player] < 10;
                                
                                return (
                                  <TableRow key={idx} className="border-border">
                                    <TableCell>
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        player.result === 'Winner' 
                                          ? 'bg-primary/20 text-primary' 
                                          : 'bg-destructive/20 text-destructive'
                                      }`}>
                                        {player.result === 'Winner' ? 'W' : 'L'}
                                      </span>
                                    </TableCell>
                                    <TableCell className={`font-medium whitespace-nowrap ${playerFilter === player.player ? 'text-primary' : 'text-foreground'}`}>
                                      {player.player}
                                      {isUnranked && (
                                        <span className="ml-2 text-xs text-muted-foreground">(Placing)</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                      {isUnranked ? '—' : player.mmrBefore.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right text-foreground font-medium whitespace-nowrap">
                                      {isUnranked ? '—' : player.mmrAfter.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                      <MmrChangeTooltip
                                        mmrChange={player.mmrChange}
                                        victoryType={player.victoryType}
                                        isWinner={player.result === 'Winner'}
                                        gamesPlayed={playerGamesCount[player.player]}
                                      >
                                        <span className={`font-medium cursor-help ${
                                          player.mmrChange > 0 ? 'text-primary' : 'text-destructive'
                                        }`}>
                                          {isUnranked ? '—' : (
                                            <>{player.mmrChange > 0 ? '▲' : '▼'}{Math.abs(player.mmrChange)}</>
                                          )}
                                        </span>
                                      </MmrChangeTooltip>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {displayCount < sortedDates.length && (
          <div ref={loadMoreRef} className="py-8 text-center text-muted-foreground">
            Loading more games...
          </div>
        )}

        {sortedDates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No games found matching your filters.
          </div>
        )}

        {/* Add Video Dialog */}
        <AddVideoDialog
          open={isAddVideoOpen}
          onOpenChange={(open) => {
            setIsAddVideoOpen(open);
            if (!open) setSelectedGameForVideo(undefined);
          }}
          defaultGameId={selectedGameForVideo}
          defaultVideoType="highlight"
        />
      <Footer />
      </main>
    </div>
  );
};

export default Games;