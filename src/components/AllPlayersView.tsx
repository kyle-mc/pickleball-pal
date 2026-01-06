import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useGames } from "@/hooks/useGames";
import { Loader2 } from "lucide-react";

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

const AllPlayersView = () => {
  const { data: allGames = [], isLoading } = useGames();

  // Calculate current stats for all players
  const playerStats = useMemo(() => {
    const uniquePlayers = [...new Set(allGames.map(g => g.player))];
    
    return uniquePlayers.map(player => {
      const games = allGames
        .filter(g => g.player === player)
        .sort((a, b) => {
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          return b.game - a.game;
        });
      
      const currentMMR = games[0]?.mmrAfter || 2000;
      const wins = games.filter(g => g.result === 'Winner').length;
      const losses = games.filter(g => g.result === 'Loser').length;
      const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;
      
      return {
        player,
        currentMMR,
        wins,
        losses,
        gamesPlayed: games.length,
        winRate,
      };
    }).sort((a, b) => b.currentMMR - a.currentMMR);
  }, [allGames]);

  // Build MMR history data for chart
  const mmrHistory = useMemo(() => {
    const uniquePlayers = [...new Set(allGames.map(g => g.player))];
    const dataMap: Map<string, Record<string, number>> = new Map();
    
    // Group by date and track MMR for each player
    allGames.forEach(game => {
      const key = game.date;
      if (!dataMap.has(key)) {
        dataMap.set(key, { date: key } as any);
      }
      const entry = dataMap.get(key)!;
      entry[game.player] = game.mmrAfter;
    });

    // Fill in missing values with last known MMR
    const sortedDates = [...dataMap.keys()].sort();
    const lastKnown: Record<string, number> = {};
    uniquePlayers.forEach(p => { lastKnown[p] = 2000; });

    return sortedDates.map(date => {
      const entry = dataMap.get(date)!;
      uniquePlayers.forEach(player => {
        if (entry[player] !== undefined) {
          lastKnown[player] = entry[player];
        }
        entry[player] = lastKnown[player];
      });
      return entry;
    });
  }, [allGames]);

  const uniquePlayers = [...new Set(allGames.map(g => g.player))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="table" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="table">Table View</TabsTrigger>
        <TabsTrigger value="chart">MMR History Chart</TabsTrigger>
      </TabsList>

      <TabsContent value="table">
        <Card className="bg-card/50 border-border overflow-hidden">
          <CardHeader>
            <CardTitle className="text-foreground">All Players MMR</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/30">
                    <TableHead className="text-muted-foreground whitespace-nowrap">Rank</TableHead>
                    <TableHead className="text-muted-foreground whitespace-nowrap">Player</TableHead>
                    <TableHead className="text-muted-foreground text-right whitespace-nowrap">MMR</TableHead>
                    <TableHead className="text-muted-foreground text-right whitespace-nowrap">W</TableHead>
                    <TableHead className="text-muted-foreground text-right whitespace-nowrap">L</TableHead>
                    <TableHead className="text-muted-foreground text-right whitespace-nowrap">Win %</TableHead>
                    <TableHead className="text-muted-foreground text-right whitespace-nowrap">Games</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerStats.map((player, i) => (
                    <TableRow key={player.player} className="border-border">
                      <TableCell>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                          i === 1 ? "bg-gray-400/20 text-gray-400" :
                          i === 2 ? "bg-amber-600/20 text-amber-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: PLAYER_COLORS[player.player] || '#888' }}
                          />
                          {player.player}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-primary font-display text-lg whitespace-nowrap">
                        {player.currentMMR.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">{player.wins}</TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">{player.losses}</TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">{player.winRate}%</TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap">{player.gamesPlayed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chart">
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">MMR Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mmrHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
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
                  <Legend />
                  {uniquePlayers.map(player => (
                    <Line
                      key={player}
                      type="monotone"
                      dataKey={player}
                      stroke={PLAYER_COLORS[player] || '#888'}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AllPlayersView;
