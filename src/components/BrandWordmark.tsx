import { cn } from "@/lib/utils";

/** PicklePlayers wordmark — the two P's are emphasized so the words read separately. */
const BrandWordmark = ({ className }: { className?: string }) => (
  <span className={cn("font-display text-2xl text-foreground tracking-wide", className)} aria-label="PicklePlayers">
    <span className="text-primary text-[1.2em] leading-none">P</span>ICKLE
    <span className="text-primary text-[1.2em] leading-none">P</span>LAYERS
  </span>
);

export default BrandWordmark;
