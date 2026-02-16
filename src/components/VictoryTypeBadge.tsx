import { useState } from "react";
import { getVictoryTypeById, getVictoryTypeFromScore, VictoryType } from "@/lib/victoryTypes";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VictoryTypeBadgeProps {
  victoryTypeId?: string;
  winningScore?: number;
  losingScore?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "text-sm px-1.5 py-0.5",
  md: "text-base px-2 py-1",
  lg: "text-lg px-3 py-1.5",
};

const EMOJI_SIZES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export function VictoryTypeBadge({ 
  victoryTypeId,
  winningScore,
  losingScore,
  showLabel = false,
  size = "md",
}: VictoryTypeBadgeProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  let victoryType: VictoryType;
  
  if (victoryTypeId) {
    victoryType = getVictoryTypeById(victoryTypeId);
  } else if (winningScore !== undefined && losingScore !== undefined) {
    victoryType = getVictoryTypeFromScore(winningScore, losingScore);
  } else {
    return null;
  }

  const content = (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md font-medium",
      victoryType.bgColor,
      victoryType.color,
      SIZE_CLASSES[size],
    )}>
      <span className={EMOJI_SIZES[size]}>{victoryType.emoji}</span>
      {showLabel && <span>{victoryType.name}</span>}
    </span>
  );

  const tooltipContent = (
    <div className="text-sm">
      <div className="font-medium">{victoryType.name}</div>
      <div className="text-muted-foreground">{victoryType.description}</div>
      <div className="text-xs mt-1">
        {victoryType.multiplier !== 1 && (
          <span className="text-primary">{victoryType.multiplier}x multiplier</span>
        )}
        {victoryType.bonus > 0 && (
          <span className="text-primary"> +{victoryType.bonus}pt bonus</span>
        )}
      </div>
    </div>
  );

  if (!showLabel) {
    return (
      <>
        {/* Desktop: Tooltip */}
        <div className="hidden sm:inline">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {content}
              </TooltipTrigger>
              <TooltipContent>{tooltipContent}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* Mobile: Popover */}
        <div className="sm:hidden inline">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              {content}
            </PopoverTrigger>
            <PopoverContent className="bg-card border-border p-3 w-auto max-w-xs">
              {tooltipContent}
            </PopoverContent>
          </Popover>
        </div>
      </>
    );
  }

  return content;
}

// Legend component to show all victory types
export function VictoryTypeLegend() {
  const victoryTypes = [
    { id: 'golden_pickle', score: '11-0' },
    { id: 'steamroller', score: '11-3' },
    { id: 'standard', score: '11-7' },
    { id: 'squeaker', score: '11-9' },
    { id: 'clutch_god', score: '12-10' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {victoryTypes.map(({ id }) => (
        <VictoryTypeBadge key={id} victoryTypeId={id} showLabel size="sm" />
      ))}
    </div>
  );
}