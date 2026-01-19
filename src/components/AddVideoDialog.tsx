import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAddVideo } from "@/hooks/useVideos";
import { usePlayers } from "@/hooks/usePlayers";
import { useGames } from "@/hooks/useGames";
import { useGroupContext } from "@/contexts/GroupContext";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGameId?: string;
  defaultVideoType?: 'highlight' | 'other';
}

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const AddVideoDialog = ({ 
  open, 
  onOpenChange, 
  defaultGameId,
  defaultVideoType = 'other' 
}: AddVideoDialogProps) => {
  const { toast } = useToast();
  const addVideoMutation = useAddVideo();
  const { data: playersList = [] } = usePlayers();
  const { data: allGames = [] } = useGames("all");
  const { currentGroup } = useGroupContext();

  const [videoType, setVideoType] = useState<'highlight' | 'other'>(defaultVideoType);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<string>(defaultGameId || "");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Reset when dialog opens with defaults
  useEffect(() => {
    if (open) {
      setVideoType(defaultVideoType);
      setSelectedGameId(defaultGameId || "");
    }
  }, [open, defaultGameId, defaultVideoType]);

  // Group games by date and game number for selection
  const gameOptions = useMemo(() => {
    const gameMap = new Map<string, { date: string; gameNum: number; players: string[] }>();
    
    allGames.forEach(g => {
      const key = `${g.date}-${g.game}`;
      if (!gameMap.has(key)) {
        gameMap.set(key, { date: g.date, gameNum: g.game, players: [] });
      }
      gameMap.get(key)!.players.push(g.player);
    });
    
    return Array.from(gameMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.gameNum - a.gameNum;
      })
      .slice(0, 50); // Show last 50 games
  }, [allGames]);

  // Auto-generate title when game is selected
  const autoTitle = useMemo(() => {
    if (!selectedGameId) return "";
    const game = gameOptions.find(g => g.id === selectedGameId);
    if (!game) return "";
    return `${format(parseISO(game.date), 'MMM d, yyyy')} - Game ${game.gameNum}`;
  }, [selectedGameId, gameOptions]);

  const handleSubmit = async () => {
    if (!youtubeUrl) {
      toast({
        title: "Missing URL",
        description: "Please provide a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    const videoId = getYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    // Use auto-generated title for highlights if not provided
    const finalTitle = title.trim() || autoTitle || "Untitled Video";

    try {
      await addVideoMutation.mutateAsync({
        title: finalTitle,
        description: description || undefined,
        youtube_url: youtubeUrl,
        players: selectedPlayers.length > 0 ? selectedPlayers : undefined,
        game_id: selectedGameId || undefined,
        video_type: videoType,
        group_id: currentGroup?.id,
      });

      toast({ title: "Video Added!", description: "Your video has been added." });
      
      // Reset form
      setYoutubeUrl("");
      setTitle("");
      setDescription("");
      setSelectedGameId("");
      setSelectedPlayers([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add video:", error);
      toast({
        title: "Error",
        description: "Failed to add video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePlayer = (player: string) => {
    setSelectedPlayers(prev => 
      prev.includes(player) 
        ? prev.filter(p => p !== player)
        : [...prev, player]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Video Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={videoType === 'highlight' ? 'default' : 'outline'}
              onClick={() => setVideoType('highlight')}
              className="flex-1"
            >
              🎬 Highlight
            </Button>
            <Button
              type="button"
              variant={videoType === 'other' ? 'default' : 'outline'}
              onClick={() => setVideoType('other')}
              className="flex-1"
            >
              📺 Tutorial/Pro
            </Button>
          </div>

          <div>
            <Label className="text-muted-foreground">YouTube URL *</Label>
            <Input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              className="bg-muted border-border"
            />
          </div>

          {videoType === 'highlight' && (
            <div>
              <Label className="text-muted-foreground">Link to Game (Optional)</Label>
              <Select value={selectedGameId} onValueChange={setSelectedGameId}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select a game..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  <SelectItem value="">No game linked</SelectItem>
                  {gameOptions.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {format(parseISO(game.date), 'MMM d')} - Game {game.gameNum} ({game.players.slice(0, 4).join(', ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGameId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-title: {autoTitle}
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">
              Title {videoType === 'highlight' && selectedGameId ? '(Optional - auto-generated if blank)' : ''}
            </Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={autoTitle || "Video title"}
              className="bg-muted border-border"
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Description (Optional)</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the video..."
              className="bg-muted border-border"
            />
          </div>

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

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            variant="hero" 
            disabled={addVideoMutation.isPending}
          >
            {addVideoMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Video"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
