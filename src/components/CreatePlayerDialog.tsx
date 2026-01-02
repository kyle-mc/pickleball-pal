import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatePlayerDialogProps {
  existingPlayers: string[];
  onPlayerCreated: (name: string) => void;
}

const CreatePlayerDialog = ({ existingPlayers, onPlayerCreated }: CreatePlayerDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmedName = playerName.trim();
    
    if (!trimmedName) {
      setError("Please enter a player name.");
      return;
    }

    if (existingPlayers.some(p => p.toLowerCase() === trimmedName.toLowerCase())) {
      setError("A player with this name already exists.");
      return;
    }

    if (trimmedName.length > 20) {
      setError("Name must be 20 characters or less.");
      return;
    }

    onPlayerCreated(trimmedName);
    
    toast({
      title: "Player Created!",
      description: `${trimmedName} has been added to the player list.`,
    });

    setPlayerName("");
    setError("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setPlayerName("");
        setError("");
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border">
          <UserPlus className="w-4 h-4 mr-2" />
          New Player
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Player</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="playerName" className="text-muted-foreground">Player Name</Label>
            <Input 
              id="playerName"
              value={playerName}
              onChange={e => {
                setPlayerName(e.target.value);
                setError("");
              }}
              placeholder="Enter player name"
              className="bg-muted border-border"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
            {error && (
              <p className="text-destructive text-sm mt-1">{error}</p>
            )}
          </div>
          <Button onClick={handleSubmit} className="w-full" variant="hero">
            Create Player
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlayerDialog;
