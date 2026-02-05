import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getVictoryTypeById, VICTORY_TYPES } from "@/lib/victoryTypes";

interface MmrChangeTooltipProps {
  mmrChange: number;
  victoryType?: string;
  isWinner: boolean;
  gamesPlayed?: number;
  children: React.ReactNode;
}

export function MmrChangeTooltip({ 
  mmrChange, 
  victoryType, 
  isWinner,
  gamesPlayed = 10,
  children 
}: MmrChangeTooltipProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const type = victoryType ? getVictoryTypeById(victoryType) : VICTORY_TYPES.standard;
  const isPlacement = gamesPlayed < 10;
  
  // Reverse-engineer the base change (approximate)
  let baseChange = mmrChange;
  if (type.bonus !== 0) baseChange -= type.bonus * (isWinner ? 1 : -1);
  if (isPlacement) baseChange = baseChange / 2;
  baseChange = Math.round(baseChange / type.multiplier);

  const content = (
    <div className="space-y-2 text-sm">
      <div className="font-medium text-foreground">MMR Calculation</div>
      <div className="space-y-1 text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span>Base Glicko-2 change:</span>
          <span className="font-mono">{baseChange > 0 ? '+' : ''}{baseChange}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Victory type ({type.name}):</span>
          <span className="font-mono">×{type.multiplier}</span>
        </div>
        {type.bonus !== 0 && (
          <div className="flex justify-between gap-4">
            <span>Clutch bonus:</span>
            <span className="font-mono">+{type.bonus}</span>
          </div>
        )}
        {isPlacement && (
          <div className="flex justify-between gap-4 text-primary">
            <span>Placement boost:</span>
            <span className="font-mono">×2</span>
          </div>
        )}
        <div className="border-t border-border pt-1 mt-1 flex justify-between gap-4 font-medium text-foreground">
          <span>Final change:</span>
          <span className={`font-mono ${mmrChange > 0 ? 'text-primary' : 'text-destructive'}`}>
            {mmrChange > 0 ? '+' : ''}{mmrChange}
          </span>
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      {/* Desktop: Use Tooltip */}
      <div className="hidden sm:inline">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {children}
            </TooltipTrigger>
            <TooltipContent className="bg-card border-border p-3 max-w-xs">
              {content}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Mobile: Use Popover for tap support */}
      <div className="sm:hidden inline">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            {children}
          </PopoverTrigger>
          <PopoverContent className="bg-card border-border p-3 max-w-xs">
            {content}
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}