import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from "recharts";
import { RANKS, getRankFromMmr, TIER_COLORS } from "@/lib/ranks";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";

interface PlayerStat {
  name: string;
  mmr: number;
  gamesPlayed: number;
}

interface MmrDistributionChartProps {
  players: PlayerStat[];
  highlightedPlayer?: string;
}

const TIER_HEX_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#4DD0E1",
  diamond: "#B9F2FF",
  champion: "#C77DFF",
  grand_champion: "#FF5252",
  supersonic_legend: "#FFE082",
};

export function MmrDistributionChart({ players, highlightedPlayer }: MmrDistributionChartProps) {
  const { placementEnabled } = usePlacementEnabled();
  const chartData = useMemo(() => {
    // Create buckets of 100 MMR each from 1000 to 3500
    const buckets: Record<number, { count: number; players: string[] }> = {};
    
    for (let mmr = 1000; mmr <= 3500; mmr += 100) {
      buckets[mmr] = { count: 0, players: [] };
    }
    
    // Only count ranked players (10+ games)
    const rankedPlayers = players.filter(p => p.gamesPlayed >= 10);
    
    rankedPlayers.forEach(player => {
      const bucket = Math.floor(player.mmr / 100) * 100;
      const clampedBucket = Math.max(1000, Math.min(3500, bucket));
      if (buckets[clampedBucket]) {
        buckets[clampedBucket].count++;
        buckets[clampedBucket].players.push(player.name);
      }
    });
    
    return Object.entries(buckets).map(([mmr, data]) => {
      const mmrNum = parseInt(mmr);
      const rank = getRankFromMmr(mmrNum + 50); // Use middle of bucket
      return {
        mmr: mmrNum,
        label: `${mmrNum}-${mmrNum + 99}`,
        count: data.count,
        players: data.players,
        tier: rank.tier,
        color: TIER_HEX_COLORS[rank.tier],
      };
    });
  }, [players]);
  
  const highlightedPlayerMmr = useMemo(() => {
    if (!highlightedPlayer || highlightedPlayer === "all") return null;
    const player = players.find(p => p.name === highlightedPlayer);
    if (!player || (placementEnabled && player.gamesPlayed < 10)) return null;
    return player.mmr;
  }, [players, highlightedPlayer]);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="font-medium text-foreground">{data.label} MMR</div>
        <div className="text-sm text-muted-foreground">{data.count} player(s)</div>
        {data.players.length > 0 && data.players.length <= 5 && (
          <div className="text-xs text-muted-foreground mt-1">
            {data.players.join(", ")}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="bg-card/50 border-border mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-lg">MMR Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis 
                dataKey="mmr" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => value % 500 === 0 ? value.toString() : ''}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
              {highlightedPlayerMmr && (
                <ReferenceLine 
                  x={Math.floor(highlightedPlayerMmr / 100) * 100} 
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                >
                  <Label 
                    value="You" 
                    position="top" 
                    fill="hsl(var(--primary))"
                    fontSize={12}
                    fontWeight="bold"
                  />
                </ReferenceLine>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend - show all tiers including SSL */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {Object.entries(TIER_HEX_COLORS).map(([tier, color]) => (
            <div key={tier} className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground capitalize">
                {tier === 'supersonic_legend' ? 'SSL' : tier.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}