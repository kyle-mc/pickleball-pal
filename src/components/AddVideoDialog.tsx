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
import { Loader2, Upload } from "lucide-react";

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

// Get video duration from browser
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Failed to load video metadata'));
    video.src = URL.createObjectURL(file);
  });
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
  const [uploadType, setUploadType] = useState<'youtube' | 'file'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<string>(defaultGameId || "");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Reset when dialog opens with defaults
  useEffect(() => {
    if (open) {
      setVideoType(defaultVideoType);
      setSelectedGameId(defaultGameId || "");
      // If we have a defaultGameId, auto-populate the players
      if (defaultGameId) {
        const gamePlayers = getGamePlayers(defaultGameId);
        setSelectedPlayers(gamePlayers);
      }
    }
  }, [open, defaultGameId, defaultVideoType]);

  // Group games by date and game number for selection - include ALL games (increased limit)
  const gameOptions = useMemo(() => {
    const gameMap = new Map<string, { date: string; gameNum: number; players: string[]; results: { player: string; result: string }[] }>();
    
    allGames.forEach(g => {
      const key = `${g.date}-${g.game}`;
      if (!gameMap.has(key)) {
        gameMap.set(key, { date: g.date, gameNum: g.game, players: [], results: [] });
      }
      const game = gameMap.get(key)!;
      game.players.push(g.player);
      game.results.push({ player: g.player, result: g.result });
    });
    
    return Array.from(gameMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.gameNum - a.gameNum;
      }); // No limit - show all games
  }, [allGames]);

  // Get players for a specific game
  const getGamePlayers = (gameId: string): string[] => {
    const game = gameOptions.find(g => g.id === gameId);
    return game?.players || [];
  };

  // Format game display as teams (winners vs losers)
  const formatGameAsTeams = (game: typeof gameOptions[0]): string => {
    const winners = game.results.filter(r => r.result === 'Winner').map(r => r.player);
    const losers = game.results.filter(r => r.result === 'Loser').map(r => r.player);
    
    if (winners.length === 2 && losers.length === 2) {
      return `${winners.join(' & ')} vs ${losers.join(' & ')}`;
    }
    return game.players.join(', ');
  };

  // When game is selected, auto-populate players
  useEffect(() => {
    if (selectedGameId && selectedGameId !== "") {
      const gamePlayers = getGamePlayers(selectedGameId);
      setSelectedPlayers(gamePlayers);
    }
  }, [selectedGameId]);

  // Auto-generate title when game is selected
  const autoTitle = useMemo(() => {
    if (!selectedGameId) return "";
    const game = gameOptions.find(g => g.id === selectedGameId);
    if (!game) return "";
    return `${format(parseISO(game.date), 'MMM d, yyyy')} - Game ${game.gameNum}`;
  }, [selectedGameId, gameOptions]);

  // Auto-generate description from game teams
  const autoDescription = useMemo(() => {
    if (!selectedGameId) return "";
    const game = gameOptions.find(g => g.id === selectedGameId);
    if (!game) return "";
    return formatGameAsTeams(game);
  }, [selectedGameId, gameOptions]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB. Please compress or trim your video.",
        variant: "destructive",
      });
      return;
    }

    // Check duration (60 seconds max)
    try {
      const duration = await getVideoDuration(file);
      if (duration > 60) {
        toast({
          title: "Video Too Long",
          description: `Video is ${Math.round(duration)} seconds. Maximum length is 60 seconds. Please trim your clip first.`,
          variant: "destructive",
        });
        return;
      }
      setVideoFile(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not read video metadata. Please try a different file.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (uploadType === 'youtube' && !youtubeUrl) {
      toast({
        title: "Missing URL",
        description: "Please provide a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    if (uploadType === 'file' && !videoFile) {
      toast({
        title: "Missing Video",
        description: "Please select a video file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (uploadType === 'youtube') {
      const videoId = getYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        toast({
          title: "Invalid URL",
          description: "Please provide a valid YouTube URL.",
          variant: "destructive",
        });
        return;
      }
    }

    // Use auto-generated title/description for highlights if not provided
    const finalTitle = title.trim() || autoTitle || "Untitled Video";
    const finalDescription = description.trim() || autoDescription || undefined;

    setIsUploading(true);

    try {
      if (uploadType === 'file' && videoFile) {
        // TODO: Implement file upload to storage
        // For now, show a message that file upload requires backend setup
        toast({
          title: "Coming Soon",
          description: "Direct video uploads will be available soon. For now, please upload to YouTube and share the link.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      await addVideoMutation.mutateAsync({
        title: finalTitle,
        description: finalDescription,
        youtube_url: youtubeUrl,
        players: selectedPlayers.length > 0 ? selectedPlayers : undefined,
        game_id: selectedGameId || undefined,
        video_type: videoType,
        group_id: currentGroup?.id,
      });

      toast({ title: "Video Added!", description: "Your video has been added." });
      
      // Reset form
      setYoutubeUrl("");
      setVideoFile(null);
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

    setIsUploading(false);
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

          {/* Upload Type Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={uploadType === 'youtube' ? 'default' : 'outline'}
              onClick={() => setUploadType('youtube')}
              className="flex-1"
              size="sm"
            >
              YouTube Link
            </Button>
            <Button
              type="button"
              variant={uploadType === 'file' ? 'default' : 'outline'}
              onClick={() => setUploadType('file')}
              className="flex-1"
              size="sm"
            >
              <Upload className="w-3 h-3 mr-1" />
              Upload File
            </Button>
          </div>

          {uploadType === 'youtube' ? (
            <div>
              <Label className="text-muted-foreground">YouTube URL *</Label>
              <Input
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="bg-muted border-border"
              />
            </div>
          ) : (
            <div>
              <Label className="text-muted-foreground">Video File (max 50MB, 60 sec)</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="bg-muted border-border"
              />
              {videoFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)}MB)
                </p>
              )}
            </div>
          )}

          {videoType === 'highlight' && (
            <div>
              <Label className="text-muted-foreground">Link to Game (Optional)</Label>
              <Select value={selectedGameId || "none"} onValueChange={(val) => setSelectedGameId(val === "none" ? "" : val)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select a game..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  <SelectItem value="none">No game linked</SelectItem>
                  {gameOptions.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {format(parseISO(game.date), 'MMM d')} - Game {game.gameNum}: {formatGameAsTeams(game)}
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
              placeholder={autoDescription || "Describe the video..."}
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
            disabled={isUploading}
          >
            {isUploading ? (
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