import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddToHomeScreenDialog } from "@/components/AddToHomeScreenDialog";
import logoMark from "@/assets/logo-mark.png";

const DISMISSED_KEY = "pwa_prompt_dismissed";
const SNOOZE_KEY = "pwa_prompt_snoozed_until";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

export function InstallAppBanner() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile || isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;
    const snoozed = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snoozed > Date.now()) return;
    const t = window.setTimeout(() => setVisible(true), 4000);
    return () => window.clearTimeout(t);
  }, [isMobile]);

  if (!visible) return null;

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setVisible(false);
  };
  const dismissForever = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  return (
    <div className="fixed left-2 right-2 bottom-20 z-50 rounded-xl border border-border bg-card/95 backdrop-blur-lg shadow-lg p-3 animate-fade-in">
      <button
        aria-label="Not now"
        onClick={snooze}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <img src={logoMark} alt="" className="h-9 w-auto" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Get the PicklePlayers app</p>
          <p className="text-muted-foreground text-xs">Install it on your home screen for the best experience.</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 [&>button]:justify-center [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-md [&>button]:h-9 [&>button:hover]:bg-primary/90">
          <AddToHomeScreenDialog />
        </div>
        <Button variant="ghost" size="sm" onClick={dismissForever} className="text-xs text-muted-foreground">
          Already installed / Don't show again
        </Button>
      </div>
    </div>
  );
}
