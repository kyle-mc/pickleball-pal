import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useGames, getPlayerSeasonGamesCount } from "@/hooks/useGames";
import { useRealtimeGames } from "@/hooks/useRealtime";
import { useGameVideos } from "@/hooks/useVideos";
import { usePlayerAvatars, getPlayerAvatar } from "@/hooks/usePlayerAvatars";
import GameEntryForm from "@/components/GameEntryForm";
import DataExportPanel from "@/components/DataExportPanel";
import { SeasonSelector } from "@/components/SeasonSelector";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { MmrChangeTooltip } from "@/components/MmrChangeTooltip";
import { AddVideoDialog } from "@/components/AddVideoDialog";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { VICTORY_TYPES } from "@/lib/victoryTypes";
import { format, parseISO } from "date-fns";
import { Filter, ArrowUpDown, Loader2, Video, Plus, Calendar, X, List, LayoutGrid } from "lucide-react";
import { getCurrentSeason } from "@/lib/seasons";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";

type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 5;

const Games = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<number | "all">(currentSeason.id);
  const { data: allGames = [], isLoading } = useGames(selectedSeason);
  useRealtimeGames();
  const { hasVideoForGame, getVideoForGame } = useGameVideos();
  const { data: avatarMap } = usePlayerAvatars();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [playerFilters, setPlayerFilters] = useState<string[]>([]);
  const [victoryTypeFilter, setVictoryTypeFilter] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [compactView, setCompactView] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [selectedGameForVideo, setSelectedGameForVideo] = useState<string | undefined>(undefined);
  const { placementEnabled } = usePlacementEnabled();

  // Handle URL params
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) setSelectedDate(dateParam);
    
    const playersParam = searchParams.get('players');
    if (playersParam) {
      setPlayerFilters(playersParam.split(',').map(p => decodeURIComponent(p)));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const uniqueDates = useMemo(() => 
    [...new Set(allGames.map(g => g.date))].sort((a, b) => 
      new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()
    ), [allGames]);

  const uniquePlayers = useMemo(() => 
    [...new Set(allGames.map(g => g.player))].sort(), [allGames]);

  const playerGamesCount = useMemo(() => {
    const counts: Record<string, number> = {};
    const season = selectedSeason === "all" ? currentSeason.id : selectedSeason;
    uniquePlayers.forEach(player => {
      counts[player] = getPlayerSeasonGamesCount(player, allGames, season);
    });
    return counts;
  }, [allGames, uniquePlayers, selectedSeason, currentSeason.id]);

  const togglePlayerFilter = (player: string) => {
    setPlayerFilters(prev => 
      prev.includes(player) ? prev.filter(p => p !== player) : [...prev, player]
    );
  };

  const filteredGames = useMemo(() => {
    let games = [...allGames];
    
    if (selectedDate) {
      games = games.filter(g => g.date === selectedDate);
    }
    
    if (playerFilters.length > 0) {
      const gameKeys = new Map<string, Set<string>>();
      games.forEach(g => {
        const key = `${g.date}-${g.game}`;
        if (!gameKeys.has(key)) gameKeys.set(key, new Set());
        gameKeys.get(key)!.add(g.player);
      });
      
      const validKeys = new Set<string>();
      for (const [key, gamePlayers] of gameKeys) {
        if (playerFilters.every(p => gamePlayers.has(p))) {
          validKeys.add(key);
        }
      }
      games = games.filter(g => validKeys.has(`${g.date}-${g.game}`));
    }

    if (victoryTypeFilter !== "all") {
      games = games.filter(g => g.victoryType === victoryTypeFilter);
    }
    
    return games;
  }, [selectedDate, playerFilters, victoryTypeFilter, allGames]);

  const groupedByDate = useMemo(() => {
    return filteredGames.reduce((acc, game) => {
      if (!acc[game.date]) acc[game.date] = {};
      if (!acc[game.date][game.game]) acc[game.date][game.game] = [];
      acc[game.date][game.game].push(game);
      return acc;
    }, {} as Record<string, Record<number, typeof allGames>>);
  }, [filteredGames]);

  const sortedDates = useMemo(() => {
    const dates = Object.keys(groupedByDate);
    return dates.sort((a, b) => {
      if (sortDirection === "desc") return new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
      return new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime();
    });
  }, [groupedByDate, sortDirection]);

  const totalFilteredGames = useMemo(() => {
    return Object.values(groupedByDate).reduce((sum, dateGames) => sum + Object.keys(dateGames).length, 0);
  }, [groupedByDate]);

  const displayedDates = sortedDates.slice(0, displayCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayCount < sortedDates.length) {
          setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedDates.length));
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [displayCount, sortedDates.length]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedDate, playerFilters, victoryTypeFilter, sortDirection]);

  const toggleSort = () => setSortDirection(prev => prev === "desc" ? "asc" : "desc");

  const handleAddVideo = (gameId: string) => {
    setSelectedGameForVideo(gameId);
    setIsAddVideoOpen(true);
  };

  const handleWatchVideo = (videoId: string) => navigate(`/videos?play=${videoId}`);

  const hasActiveFilters = selectedDate || playerFilters.length > 0 || victoryTypeFilter !== "all";

  const formatPlayedAt = (playedAt?: string) => {
    if (!playedAt) return null;
    try {
      const d = new Date(playedAt);
      return format(d, 'h:mm a');
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-32 md:pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32 md:pb-20 max-w-full overflow-x-hidden">
        {/* Sticky header */}
        <div className="sticky top-16 z-30 bg-background pb-4 -mx-4 px-4 border-b border-border mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-0.5 leading-none">Games</h1>
              <p className="text-muted-foreground text-sm">
                {totalFilteredGames} game{totalFilteredGames !== 1 ? 's' : ''}
                {hasActiveFilters ? ' (filtered)' : ''}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCompactView(!compactView)}
                      className="h-9 w-9"
                    >
                      {compactView ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{compactView ? 'Expanded view' : 'Compact view'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DataExportPanel />
              <GameEntryForm />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <SeasonSelector 
              selectedSeason={selectedSeason} 
              onSeasonChange={setSelectedSeason} 
            />

            <Select value={selectedDate || "all"} onValueChange={(val) => setSelectedDate(val === "all" ? null : val)}>
              <SelectTrigger className="w-[160px] bg-card border-border h-9 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50 max-h-60">
                <SelectItem value="all">All Dates</SelectItem>
                {uniqueDates.map(date => (
                  <SelectItem key={date} value={date}>
                    {format(parseISO(date), 'MMM d, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] bg-card border-border justify-start gap-2 h-9 text-sm">
                  <Filter className="w-4 h-4" />
                  {playerFilters.length > 0 ? `${playerFilters.length} player${playerFilters.length > 1 ? 's' : ''}` : "All Players"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2 bg-card border-border" align="start">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {uniquePlayers.map(player => (
                    <label key={player} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-sm">
                      <Checkbox 
                        checked={playerFilters.includes(player)} 
                        onCheckedChange={() => togglePlayerFilter(player)} 
                      />
                      <span className="text-foreground">{player}</span>
                    </label>
                  ))}
                </div>
                {playerFilters.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setPlayerFilters([])}>
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <Select value={victoryTypeFilter} onValueChange={setVictoryTypeFilter}>
              <SelectTrigger className="w-[170px] bg-card border-border h-9 text-sm">
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-sm h-9"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortDirection === "desc" ? "Newest" : "Oldest"}
            </button>
          </div>
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
                  .sort(([a], [b]) => sortDirection === "desc" ? Number(b) - Number(a) : Number(a) - Number(b))
                  .map(([gameNum, players]) => {
                    const winners = players.filter(p => p.result === 'Winner');
                    const losers = players.filter(p => p.result === 'Loser');
                    const score = players[0]?.score;
                    const victoryType = players[0]?.victoryType;
                    const playedAtStr = formatPlayedAt(players[0]?.playedAt);
                    const gameKey = `${date}-${gameNum}`;
                    const video = getVideoForGame(gameKey);
                    const hasVideo = hasVideoForGame(gameKey);
                    
                    if (compactView) {
                      return (
                        <div key={gameNum} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border text-sm">
                          <span className="text-muted-foreground font-medium w-14 shrink-0">G{gameNum}</span>
                          {playedAtStr && <span className="text-muted-foreground text-xs w-16 shrink-0">{playedAtStr}</span>}
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="text-primary font-medium truncate">
                              {winners.map(w => w.player).join(' & ')}
                            </span>
                            <span className="text-muted-foreground mx-1">vs</span>
                            <span className="text-destructive/80 truncate">
                              {losers.map(l => l.player).join(' & ')}
                            </span>
                          </div>
                          {score && <span className="text-muted-foreground text-xs shrink-0">{score}</span>}
                          {victoryType && victoryType !== 'standard' && (
                            <VictoryTypeBadge victoryTypeId={victoryType} size="sm" />
                          )}
                        </div>
                      );
                    }

                    return (
                      <Card key={gameNum} className="bg-card border-border overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium flex items-center gap-3 flex-wrap">
                            <span>Game {gameNum}</span>
                            {playedAtStr && <span className="text-muted-foreground text-xs font-normal">{playedAtStr}</span>}
                            {score && <span className="text-muted-foreground text-sm font-normal">({score})</span>}
                            {victoryType && <VictoryTypeBadge victoryTypeId={victoryType} size="sm" />}
                            
                            <div className="ml-auto flex items-center gap-2">
                              {hasVideo && video ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleWatchVideo(video.id)}>
                                        <Video className="w-4 h-4 mr-1" />Watch
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Watch video highlight</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleAddVideo(gameKey)}>
                                        <Plus className="w-4 h-4 mr-1" /><Video className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Add video for this game</p></TooltipContent>
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
                                const isUnranked = placementEnabled && playerGamesCount[player.player] < 10;
                                
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
                                    <TableCell className={`font-medium whitespace-nowrap ${playerFilters.includes(player.player) ? 'text-primary' : 'text-foreground'}`}>
                                      <div className="flex items-center gap-2">
                                        <PlayerAvatar 
                                          name={player.player} 
                                          avatarUrl={getPlayerAvatar(player.player, avatarMap)}
                                          size="xs"
                                        />
                                        <span>
                                          {player.player}
                                          {isUnranked && (
                                            <span className="ml-2 text-xs text-muted-foreground">(Placing)</span>
                                          )}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                      {isUnranked ? '???' : player.mmrBefore.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right text-foreground font-medium whitespace-nowrap">
                                      {isUnranked ? '???' : player.mmrAfter.toLocaleString()}
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
                                          {isUnranked ? '???' : (
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
      <MobileBottomNav />
      </main>
    </div>
  );
};

export default Games;
