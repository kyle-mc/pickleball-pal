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
import { useGames, getPlayerSeasonGamesCount, useSubmitGame, type GameRecord } from "@/hooks/useGames";
import { useToast } from "@/hooks/use-toast";
import { useCurrentGroup } from "@/hooks/useGroups";
import { useRealtimeGames } from "@/hooks/useRealtime";
import { useGameVideos } from "@/hooks/useVideos";
import { usePlayerAvatars, getPlayerAvatar } from "@/hooks/usePlayerAvatars";
import GameEntryForm from "@/components/GameEntryForm";
import GameEditDialog from "@/components/GameEditDialog";
import DataExportPanel from "@/components/DataExportPanel";
import { SeasonSelector } from "@/components/SeasonSelector";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { MmrChangeTooltip } from "@/components/MmrChangeTooltip";
import { AddVideoDialog } from "@/components/AddVideoDialog";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { VICTORY_TYPES } from "@/lib/victoryTypes";
import { format, parseISO } from "date-fns";
import { Filter, ArrowUpDown, Loader2, Video, Plus, Calendar, X, List, LayoutGrid, Pencil, ChevronDown, ChevronRight, MoreVertical, Trash2, Copy } from "lucide-react";
import { getCurrentSeason } from "@/lib/seasons";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLongPressDuration } from "@/hooks/useLongPressDuration";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 5;

const Games = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<number | "all">(currentSeason.id);
  const [gameMode, setGameMode] = useState<'doubles' | 'singles'>('doubles');
  const { data: allGames = [], isLoading } = useGames(selectedSeason, gameMode);
  useRealtimeGames();
  const { hasVideoForGame, getVideoForGame } = useGameVideos();
  const { data: avatarMap } = usePlayerAvatars();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [playerFilters, setPlayerFilters] = useState<string[]>([]);
  const [victoryTypeFilter, setVictoryTypeFilter] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [compactView, setCompactView] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [editingGameRows, setEditingGameRows] = useState<GameRecord[] | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const longPressMs = useLongPressDuration();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const submitGame = useSubmitGame();
  const { currentGroup } = useCurrentGroup();

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

  const toggleDateCollapsed = (date: string) => {
    setCollapsedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  };

  const [duplicatePrefill, setDuplicatePrefill] = useState<import("@/components/GameEntryForm").GameEntryPrefill | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const duplicateGame = (rows: GameRecord[]) => {
    const winners = rows.filter(r => r.result === 'Winner').map(r => r.player);
    const losers = rows.filter(r => r.result === 'Loser').map(r => r.player);
    const score = rows[0]?.score || '';
    const [w, l] = score.split('-').map(s => s.trim());
    setDuplicatePrefill({
      date: rows[0]?.date,
      gameMode: rows[0]?.gameMode || 'doubles',
      winningPlayers: winners,
      losingPlayers: losers,
      winningScore: w || '11',
      losingScore: l || '0',
      neverServed: rows[0]?.victoryType === 'golden_pickle',
    });
    setDuplicateOpen(true);
  };

  const deleteGame = async (rows: GameRecord[]) => {
    const ids = rows.map(r => r.id).filter(Boolean) as string[];
    if (!ids.length) return;
    if (!window.confirm('Delete this game? Ratings will stay until an admin recalculates MMR.')) return;
    const { error } = await supabase.from('games').delete().in('id', ids);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['games'] });
    toast({ title: 'Game deleted' });
  };

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-32 md:pb-20 max-w-full">
        {/* Sticky header */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur pb-4 -mx-4 px-4 border-b border-border mb-6">
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
                      onClick={() => setCompactView(!compactView)}
                      className="h-9 min-w-[110px] justify-center gap-2 px-3"
                    >
                      {compactView ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                      <span>{compactView ? "Compact" : "Expanded"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{compactView ? 'Expanded view' : 'Compact view'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DataExportPanel />
              <GameEntryForm defaultGameMode="doubles" />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            {/* Doubles / Singles toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden h-9 text-sm">
              <button
                onClick={() => setGameMode('doubles')}
                className={`px-3 transition-colors ${gameMode === 'doubles' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
              >
                Doubles
              </button>
              <button
                onClick={() => setGameMode('singles')}
                className={`px-3 transition-colors ${gameMode === 'singles' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
              >
                Singles
              </button>
            </div>
            <SeasonSelector 
              selectedSeason={selectedSeason} 
              onSeasonChange={setSelectedSeason} 
              triggerClassName="w-[170px] h-9 text-sm whitespace-nowrap"
            />

            <Select value={selectedDate || "all"} onValueChange={(val) => setSelectedDate(val === "all" ? null : val)}>
              <SelectTrigger className="w-[142px] bg-card border-border h-9 text-sm">
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
                <Button variant="outline" className="w-[142px] bg-card border-border justify-start gap-2 h-9 text-sm">
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
              <SelectTrigger className="w-[148px] bg-card border-border h-9 text-sm">
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
          {displayedDates.map(date => {
            const isCollapsed = collapsedDates.has(date);
            const dateGameCount = Object.keys(groupedByDate[date]).length;
            return (
            <div key={date}>
              <button
                onClick={() => toggleDateCollapsed(date)}
                className="flex items-center gap-2 mb-4 text-left w-full group"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed
                  ? <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  : <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />}
                <h2 className="text-2xl font-display text-foreground">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </h2>
                <span className="text-sm text-muted-foreground">({dateGameCount})</span>
              </button>
              {!isCollapsed && (
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
                        <GameRowActions
                          key={gameNum}
                          longPressMs={longPressMs}
                          onEdit={() => setEditingGameRows(players)}
                          onDuplicate={() => duplicateGame(players)}
                          onDelete={() => deleteGame(players)}
                          onAddVideo={() => handleAddVideo(gameKey)}
                          onWatchVideo={video ? () => handleWatchVideo(video.id) : undefined}
                          hasVideo={hasVideo}
                        >
                          <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-card border border-border text-xs sm:text-sm select-none">
                            <span className="text-muted-foreground font-medium w-7 sm:w-10 shrink-0 text-center">G{gameNum}</span>
                            {playedAtStr && <span className="text-muted-foreground text-[10px] sm:text-xs w-14 sm:w-16 shrink-0 hidden sm:inline">{playedAtStr}</span>}
                            <div className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0 overflow-hidden">
                              <span className="text-primary font-medium truncate max-w-[40%]">
                                {winners.map(w => w.player).join(' & ')}
                              </span>
                              <span className="text-muted-foreground mx-0.5">v</span>
                              <span className="text-destructive/80 truncate max-w-[40%]">
                                {losers.map(l => l.player).join(' & ')}
                              </span>
                            </div>
                            {score && <span className="text-muted-foreground text-[10px] sm:text-xs shrink-0">{score}</span>}
                            <VictoryTypeBadge victoryTypeId={victoryType || 'standard'} size="sm" />
                          </div>
                        </GameRowActions>
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
                              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setEditingGameRows(players)}>
                                <Pencil className="w-4 h-4 mr-1" />
                                Edit Game
                              </Button>
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
                        <CardContent>
                          <div className="sm:hidden space-y-2">
                            {[...winners, ...losers].map((player, idx) => {
                              const isUnranked = placementEnabled && playerGamesCount[player.player] < 10;

                              return (
                                <div key={idx} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <PlayerAvatar 
                                        name={player.player} 
                                        avatarUrl={getPlayerAvatar(player.player, avatarMap)}
                                        size="xs"
                                      />
                                      <span className={`font-medium truncate ${playerFilters.includes(player.player) ? 'text-primary' : 'text-foreground'}`}>
                                        {player.player}
                                      </span>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium shrink-0 ${
                                      player.result === 'Winner' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                                    }`}>
                                      {player.result === 'Winner' ? 'W' : 'L'}
                                    </span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <div className="text-muted-foreground">Before</div>
                                      <div className="font-medium text-foreground">{isUnranked ? '???' : player.mmrBefore.toLocaleString()}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">After</div>
                                      <div className="font-medium text-foreground">{isUnranked ? '???' : player.mmrAfter.toLocaleString()}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">Change</div>
                                      <MmrChangeTooltip
                                        mmrChange={player.mmrChange}
                                        victoryType={player.victoryType}
                                        isWinner={player.result === 'Winner'}
                                        gamesPlayed={playerGamesCount[player.player]}
                                      >
                                        <span className={`font-medium cursor-help ${player.mmrChange > 0 ? 'text-primary' : 'text-destructive'}`}>
                                          {isUnranked ? '???' : <>{player.mmrChange > 0 ? '▲' : '▼'}{Math.abs(player.mmrChange)}</>}
                                        </span>
                                      </MmrChangeTooltip>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="hidden sm:block">
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
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
              )}
            </div>
            );
          })}
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
        <GameEditDialog
          open={Boolean(editingGameRows)}
          onOpenChange={(open) => {
            if (!open) setEditingGameRows(null);
          }}
          gameRows={editingGameRows}
        />
        <GameEntryForm
          hideTrigger
          open={duplicateOpen}
          onOpenChange={(o) => {
            setDuplicateOpen(o);
            if (!o) setDuplicatePrefill(null);
          }}
          prefill={duplicatePrefill}
          defaultGameMode="doubles"
        />
      <Footer />
      <MobileBottomNav />
      </main>
    </div>
  );
};

interface GameRowActionsProps {
  longPressMs: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddVideo: () => void;
  onWatchVideo?: () => void;
  hasVideo: boolean;
  children: React.ReactNode;
}

function GameRowActions({ longPressMs, onEdit, onDuplicate, onDelete, onAddVideo, onWatchVideo, hasVideo, children }: GameRowActionsProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const start = () => {
    fired.current = false;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      fired.current = true;
      onEdit();
    }, longPressMs);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <div className="relative flex items-stretch gap-1">
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onTouchStart={start}
        onTouchEnd={cancel}
        onTouchMove={cancel}
        onTouchCancel={cancel}
        onMouseDown={start}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onContextMenu={(e) => { e.preventDefault(); setOpen(true); }}
        onClick={() => { if (!fired.current) onEdit(); }}
      >
        {children}
      </div>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="shrink-0 px-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50" aria-label="More actions">
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border z-50">
          <DropdownMenuItem onClick={onEdit}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
          {hasVideo && onWatchVideo
            ? <DropdownMenuItem onClick={onWatchVideo}><Video className="w-4 h-4 mr-2" /> Watch Video</DropdownMenuItem>
            : <DropdownMenuItem onClick={onAddVideo}><Video className="w-4 h-4 mr-2" /> Add Video</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default Games;
