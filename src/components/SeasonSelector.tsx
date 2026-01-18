import { SEASONS, getCurrentSeason, Season } from "@/lib/seasons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface SeasonSelectorProps {
  selectedSeason: number | "all";
  onSeasonChange: (season: number | "all") => void;
  showCurrentBadge?: boolean;
}

export function SeasonSelector({ 
  selectedSeason, 
  onSeasonChange,
  showCurrentBadge = true,
}: SeasonSelectorProps) {
  const currentSeason = getCurrentSeason();

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <Select
        value={String(selectedSeason)}
        onValueChange={(value) => onSeasonChange(value === "all" ? "all" : parseInt(value))}
      >
        <SelectTrigger className="w-[180px] bg-card border-border">
          <SelectValue placeholder="Select season" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50">
          <SelectItem value="all">All Seasons</SelectItem>
          {SEASONS.map((season) => (
            <SelectItem key={season.id} value={String(season.id)}>
              <span className="flex items-center gap-2">
                {season.name}
                {showCurrentBadge && season.id === currentSeason.id && (
                  <Badge variant="secondary" className="text-xs ml-1">Current</Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Current season display badge
export function CurrentSeasonBadge() {
  const season = getCurrentSeason();
  
  return (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
      <Calendar className="w-3 h-3 mr-1" />
      {season.name}
    </Badge>
  );
}
