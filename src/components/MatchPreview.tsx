import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGames, getPlayerMMR, getPlayerSeasonGamesCount } from "@/hooks/useGames";
import { usePlayerAvatars, getPlayerAvatar } from "@/hooks/usePlayerAvatars";
import { getCurrentSeason } from "@/lib/seasons";
import { VICTORY_TYPES, VictoryType } from "@/lib/victoryTypes";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Percent } from "lucide-react";

interface MatchPreviewProps {
  team1: string[];
  team2: string[];
}

export function MatchPreview({ team1, team2 }: MatchPreviewProps) {
  const currentSeason = getCurrentSeason();
  const { data: allGames = [] } = useGames("all");
  const { data: avatarMap } = usePlayerAvatars();
  
  const preview = useMemo(() => {
    if (team1.length !== 2 || team2.length !== 2) return null;
    
    const team1Mmrs = team1.map(p => getPlayerMMR(p, allGames));
    const team2Mmrs = team2.map(p => getPlayerMMR(p, allGames));
    
    const team1AvgMmr = (team1Mmrs[0] + team1Mmrs[1]) / 2;
    const team2AvgMmr = (team2Mmrs[0] + team2Mmrs[1]) / 2;
    
    const mmrDiff = team1AvgMmr - team2AvgMmr;
    const team1WinProb = 1 / (1 + Math.pow(10, -mmrDiff / 400));
    const team2WinProb = 1 - team1WinProb;
    
    const baseK = 32;
    const expectedScore1 = team1WinProb;
    const expectedScore2 = team2WinProb;
    
    const getEstimatedChange = (victoryType: VictoryType, isWinner: boolean, isTeam1: boolean) => {
      const actualScore = isWinner ? 1 : 0;
      const expected = isTeam1 ? (isWinner ? expectedScore1 : expectedScore2) : (isWinner ? expectedScore2 : expectedScore1);
      let change = baseK * (actualScore - expected);
      change = change * victoryType.multiplier;
      if (victoryType.bonus) change += victoryType.bonus * (isWinner ? 1 : -1);
      return Math.round(change);
    };
    
    const placementStatus = [...team1, ...team2].map(p => ({
      name: p,
      gamesPlayed: getPlayerSeasonGamesCount(p, allGames, currentSeason.id),
      isPlacement: getPlayerSeasonGamesCount(p, allGames, currentSeason.id) < 10,
    }));
    
    return {
      team1: { players: team1, mmrs: team1Mmrs, avgMmr: team1AvgMmr, winProb: team1WinProb },
      team2: { players: team2, mmrs: team2Mmrs, avgMmr: team2AvgMmr, winProb: team2WinProb },
      victoryPreviews: Object.values(VICTORY_TYPES).map(vt => ({
        type: vt,
        team1Win: getEstimatedChange(vt, true, true),
        team1Lose: getEstimatedChange(vt, false, true),
        team2Win: getEstimatedChange(vt, true, false),
        team2Lose: getEstimatedChange(vt, false, false),
      })),
      placementStatus,
    };
  }, [team1, team2, allGames, currentSeason.id]);
  
  if (!preview) return null;
  
  const { team1: t1, team2: t2, victoryPreviews, placementStatus } = preview;
  
  return (
    <Card className="bg-muted/30 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Match Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Probability */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {t1.players.map((p, i) => (
                <div key={p} className="flex items-center gap-1">
                  <PlayerAvatar name={p} avatarUrl={getPlayerAvatar(p, avatarMap)} size="xs" />
                  <span>{p}</span>
                  {i === 0 && <span className="mx-1">&</span>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {t2.players.map((p, i) => (
                <div key={p} className="flex items-center gap-1">
                  {i === 1 && <span className="mx-1">&</span>}
                  <span>{p}</span>
                  <PlayerAvatar name={p} avatarUrl={getPlayerAvatar(p, avatarMap)} size="xs" />
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-6 rounded-full overflow-hidden bg-muted">
            <div 
              className="absolute left-0 top-0 h-full bg-primary transition-all flex items-center justify-center"
              style={{ width: `${t1.winProb * 100}%` }}
            >
              <span className="text-xs font-medium text-primary-foreground drop-shadow">{(t1.winProb * 100).toFixed(0)}%</span>
            </div>
            <div 
              className="absolute right-0 top-0 h-full bg-destructive transition-all flex items-center justify-center"
              style={{ width: `${t2.winProb * 100}%` }}
            >
              <span className="text-xs font-medium text-destructive-foreground drop-shadow">{(t2.winProb * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Avg MMR: {Math.round(t1.avgMmr)}</span>
            <span>Avg MMR: {Math.round(t2.avgMmr)}</span>
          </div>
        </div>
        
        {/* Placement Status */}
        {placementStatus.some(p => p.isPlacement) && (
          <div className="text-xs bg-primary/10 text-primary rounded p-2">
            <span className="font-medium">Placement Boost (2x):</span>{' '}
            {placementStatus.filter(p => p.isPlacement).map(p => 
              `${p.name} (${p.gamesPlayed}/10)`
            ).join(', ')}
          </div>
        )}
        
        {/* Potential MMR Changes - single table with winner/loser columns */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Potential MMR Changes:
          </div>
          
          {/* Header */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground gap-1">
            <div>Victory Type</div>
            <div className="text-center text-primary">Winners</div>
            <div className="text-center text-destructive">Losers</div>
          </div>
          
          {/* If Team 1 (left) wins */}
          <div className="text-[10px] text-muted-foreground font-medium mb-1">
            If {t1.players.join(' & ')} win:
          </div>
          <div className="grid gap-1">
            {victoryPreviews.map(({ type, team1Win, team2Lose }) => (
              <div key={`t1-${type.id}`} className="grid grid-cols-3 items-center text-xs gap-1">
                <VictoryTypeBadge victoryTypeId={type.id} size="sm" />
                <div className="text-center text-primary font-mono">+{team1Win}</div>
                <div className="text-center text-destructive font-mono">{team2Lose}</div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-border my-2" />
          
          {/* If Team 2 (right) wins */}
          <div className="text-[10px] text-muted-foreground font-medium mb-1">
            If {t2.players.join(' & ')} win:
          </div>
          <div className="grid gap-1">
            {victoryPreviews.map(({ type, team2Win, team1Lose }) => (
              <div key={`t2-${type.id}`} className="grid grid-cols-3 items-center text-xs gap-1">
                <VictoryTypeBadge victoryTypeId={type.id} size="sm" />
                <div className="text-center text-primary font-mono">+{team2Win}</div>
                <div className="text-center text-destructive font-mono">{team1Lose}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}