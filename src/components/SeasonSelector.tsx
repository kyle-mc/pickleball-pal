import { SEASONS, getCurrentSeason, Season } from "@/lib/seasons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface SeasonSelectorProps {
  selectedSeason: number | "all";
  onSeasonChange: (season: number | "all") => void;
  showCurrentBadge?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SeasonSelector({ 
  selectedSeason, 
  onSeasonChange,
  showCurrentBadge = true,
  className,
  triggerClassName,
}: SeasonSelectorProps) {
  const currentSeason = getCurrentSeason();

  const isCurrent = selectedSeason !== "all" && selectedSeason === currentSeason.id;
  const seasonObj = selectedSeason === "all" ? null : SEASONS.find(s => s.id === selectedSeason);

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
      <Select
        value={String(selectedSeason)}
        onValueChange={(value) => onSeasonChange(value === "all" ? "all" : parseInt(value))}
      >
        <SelectTrigger className={`w-[180px] bg-card border-border ${triggerClassName ?? ""}`}>
          {/* Custom trigger content so we can show the Current badge alongside the season name */}
          <span className="flex items-center gap-1.5 truncate">
            <span className="whitespace-nowrap">
              {selectedSeason === "all" ? "All Seasons" : (seasonObj?.name ?? "Season")}
            </span>
            {showCurrentBadge && isCurrent && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 leading-none whitespace-nowrap">Current</Badge>
            )}
          </span>
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50">
          <SelectItem value="all">All Seasons</SelectItem>
          {SEASONS.map((season) => (
            <SelectItem key={season.id} value={String(season.id)}>
              <span className="flex items-center gap-2 whitespace-nowrap">
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
