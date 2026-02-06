import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePlayers } from "@/hooks/usePlayers";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  players: string[];
  video_type: string;
  game_id: string | null;
}

interface EditVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video | null;
}

export function EditVideoDialog({ open, onOpenChange, video }: EditVideoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: playersList = [] } = usePlayers();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (video && open) {
      setTitle(video.title);
      setDescription(video.description || "");
      setSelectedPlayers(video.players || []);
    }
  }, [video, open]);

  const togglePlayer = (player: string) => {
    setSelectedPlayers(prev => 
      prev.includes(player) 
        ? prev.filter(p => p !== player)
        : [...prev, player]
    );
  };

  const handleSubmit = async () => {
    if (!video) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('videos')
      .update({
        title,
        description: description || null,
        players: selectedPlayers,
      })
      .eq('id', video.id);

    if (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Video updated!" });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      onOpenChange(false);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-muted-foreground">Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Video title"
              className="bg-muted border-border"
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the video..."
              className="bg-muted border-border"
            />
          </div>

          {/* Only show Featured Players for Game Highlights */}
          {(video?.video_type === 'highlight' || video?.game_id) && (
            <div>
              <Label className="text-muted-foreground">Featured Players</Label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                {playersList.map(player => (
                  <button
                    key={player}
                    type="button"
                    onClick={() => togglePlayer(player)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedPlayers.includes(player)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {player}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            variant="hero" 
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}