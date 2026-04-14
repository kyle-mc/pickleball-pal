import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AddToHomeScreenDialog() {
  // Hide if running as installed PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;
  
  if (isStandalone) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground w-full">
          <Smartphone className="w-4 h-4" />
          Install App
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Add to Home Screen
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="apple" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apple">🍎 iPhone / iPad</TabsTrigger>
            <TabsTrigger value="android">🤖 Android</TabsTrigger>
          </TabsList>

          <TabsContent value="apple" className="space-y-4 mt-4">
            <ol className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span>Open this site in <strong className="text-foreground">Safari</strong> (not Chrome or other browsers).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <span>Tap the <strong className="text-foreground">Share</strong> button (the square with an arrow pointing up) at the bottom of the screen.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <span>Scroll down and tap <strong className="text-foreground">"Add to Home Screen."</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                <span>Tap <strong className="text-foreground">"Add"</strong> in the top-right corner. The app icon will appear on your home screen!</span>
              </li>
            </ol>
          </TabsContent>

          <TabsContent value="android" className="space-y-4 mt-4">
            <ol className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span>Open this site in <strong className="text-foreground">Chrome</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <span>Tap the <strong className="text-foreground">three-dot menu</strong> (⋮) in the top-right corner.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap <strong className="text-foreground">"Add to Home screen"</strong> or <strong className="text-foreground">"Install app."</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                <span>Tap <strong className="text-foreground">"Add"</strong> to confirm. The app icon will appear on your home screen!</span>
              </li>
            </ol>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
