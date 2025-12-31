import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gamesData } from "@/data/games";
import { useState } from "react";
import { format } from "date-fns";

const Games = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get unique dates for filtering
  const uniqueDates = [...new Set(gamesData.map(g => g.date))].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Group games by date and game number for display
  const filteredGames = selectedDate 
    ? gamesData.filter(g => g.date === selectedDate)
    : gamesData;

  // Group by date, then by game number
  const groupedByDate = filteredGames.reduce((acc, game) => {
    if (!acc[game.date]) acc[game.date] = {};
    if (!acc[game.date][game.game]) acc[game.date][game.game] = [];
    acc[game.date][game.game].push(game);
    return acc;
  }, {} as Record<string, Record<number, typeof gamesData>>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-display text-foreground mb-2">Games</h1>
          <p className="text-muted-foreground">All pickleball games and MMR changes</p>
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
          {sortedDates.map(date => (
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
                      <Card key={gameNum} className="bg-card border-border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium">
                            Game {gameNum}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border">
                                <TableHead className="text-muted-foreground">Result</TableHead>
                                <TableHead className="text-muted-foreground">Player</TableHead>
                                <TableHead className="text-muted-foreground text-right">MMR Before</TableHead>
                                <TableHead className="text-muted-foreground text-right">MMR After</TableHead>
                                <TableHead className="text-muted-foreground text-right">Change</TableHead>
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
                                  <TableCell className="font-medium text-foreground">
                                    {player.player}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {player.mmrBefore.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right text-foreground font-medium">
                                    {player.mmrAfter.toLocaleString()}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium ${
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
      </main>
    </div>
  );
};

export default Games;
