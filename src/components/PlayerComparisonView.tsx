import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface PlayerComparisonViewProps {
  selectedPlayers: string[];
}

const PlayerComparisonView = ({ selectedPlayers }: PlayerComparisonViewProps) => {
  const { data: allGames = [], isLoading } = useGames();

  // Calculate stats for selected players
  const playerStats = useMemo(() => {
    return selectedPlayers.map(player => {
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
        color: PLAYER_COLORS[player] || '#888',
      };
    });
  }, [selectedPlayers, allGames]);

  // Build MMR history data for chart (only for selected players)
  const mmrHistory = useMemo(() => {
    const dataMap: Map<string, Record<string, number>> = new Map();
    
    allGames
      .filter(g => selectedPlayers.includes(g.player))
      .forEach(game => {
        const key = game.date;
        if (!dataMap.has(key)) {
          dataMap.set(key, { date: key } as any);
        }
        const entry = dataMap.get(key)!;
        entry[game.player] = game.mmrAfter;
      });

    const sortedDates = [...dataMap.keys()].sort();
    const lastKnown: Record<string, number> = {};
    selectedPlayers.forEach(p => { lastKnown[p] = 2000; });

    return sortedDates.map(date => {
      const entry = dataMap.get(date)!;
      selectedPlayers.forEach(player => {
        if (entry[player] !== undefined) {
          lastKnown[player] = entry[player];
        }
        entry[player] = lastKnown[player];
      });
      return entry;
    });
  }, [selectedPlayers, allGames]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedPlayers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Select players to compare their stats
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Comparison Cards */}
      <div className={`grid gap-4 ${
        selectedPlayers.length === 2 ? 'md:grid-cols-2' : 
        selectedPlayers.length === 3 ? 'md:grid-cols-3' : 
        'md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {playerStats.map(stat => (
          <Card key={stat.player} className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: stat.color }}
                />
                {stat.player}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">MMR</span>
                  <span className="text-foreground font-display text-xl">{stat.currentMMR}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Win Rate</span>
                  <span className="text-foreground font-medium">{stat.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Record</span>
                  <span className="text-foreground font-medium">{stat.wins}W - {stat.losses}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Games</span>
                  <span className="text-foreground font-medium">{stat.gamesPlayed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MMR Comparison Chart */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">MMR Comparison Over Time</CardTitle>
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
                {selectedPlayers.map(player => (
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
    </div>
  );
};

export default PlayerComparisonView;
