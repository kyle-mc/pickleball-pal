import { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGames } from "@/hooks/useGames";
import GameEntryForm from "@/components/GameEntryForm";
import DataExportPanel from "@/components/DataExportPanel";
import { format } from "date-fns";
import { Filter, ArrowUpDown, Loader2 } from "lucide-react";

type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 5;

const Games = () => {
  const { data: allGames = [], isLoading } = useGames();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get unique dates for filtering
  const uniqueDates = useMemo(() => 
    [...new Set(allGames.map(g => g.date))].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    ), [allGames]);

  // Get unique players for filtering
  const uniquePlayers = useMemo(() => 
    [...new Set(allGames.map(g => g.player))].sort(), [allGames]);

  // Filter games by date and player
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
    
    return games;
  }, [selectedDate, playerFilter, allGames]);

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
        return new Date(b).getTime() - new Date(a).getTime();
      }
      return new Date(a).getTime() - new Date(b).getTime();
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
  }, [selectedDate, playerFilter, sortDirection]);

  const toggleSort = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
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
              {format(new Date(date), 'MMM d, yyyy')}
            </button>
          ))}
        </div>

        {/* Games by Date */}
        <div className="space-y-8">
          {displayedDates.map(date => (
            <div key={date}>
              <h2 className="text-2xl font-display text-foreground mb-4">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h2>
              <div className="grid gap-4">
                {Object.entries(groupedByDate[date])
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([gameNum, players]) => {
                    const winners = players.filter(p => p.result === 'Winner');
                    const losers = players.filter(p => p.result === 'Loser');
                    
                    return (
                      <Card key={gameNum} className="bg-card border-border overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium">
                            Game {gameNum}
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
                              {[...winners, ...losers].map((player, idx) => (
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
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                    {player.mmrBefore.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right text-foreground font-medium whitespace-nowrap">
                                    {player.mmrAfter.toLocaleString()}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium whitespace-nowrap ${
                                    player.mmrChange > 0 ? 'text-primary' : 'text-destructive'
                                  }`}>
                                    {player.mmrChange > 0 ? '▲' : '▼'}{Math.abs(player.mmrChange)}
                                  </TableCell>
                                </TableRow>
                              ))}
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
      </main>
    </div>
  );
};

export default Games;
