import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSeasonFromDate, getCurrentSeason } from "@/lib/seasons";

interface SeasonConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onConfirm: () => void;
}

export function SeasonConfirmDialog({ 
  open, 
  onOpenChange, 
  date, 
  onConfirm 
}: SeasonConfirmDialogProps) {
  const dateSeason = getSeasonFromDate(date);
  const currentSeason = getCurrentSeason();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Different Season Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            The date you selected ({date}) falls in <strong className="text-primary">Season {dateSeason.id}</strong>, 
            but we're currently in <strong className="text-primary">Season {currentSeason.id}</strong>.
            <br /><br />
            Are you sure you want to add this game to Season {dateSeason.id}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-primary text-primary-foreground">
            Yes, Add to Season {dateSeason.id}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}