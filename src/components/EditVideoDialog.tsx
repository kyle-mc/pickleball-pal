import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePlayers } from "@/hooks/usePlayers";
import { useGames } from "@/hooks/useGames";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { srtToText } from "@/lib/srt";

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  players: string[];
  video_type: string;
  game_id: string | null;
  transcript?: string | null;
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
  const { data: allGames = [] } = useGames("all");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("none");
  const [transcript, setTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const srtInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (video && open) {
      setTitle(video.title);
      setDescription(video.description || "");
      setSelectedPlayers(video.players || []);
      setSelectedGameId(video.game_id || "none");
      setTranscript(video.transcript || "");
    }
  }, [video, open]);

  const handleSrtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "SRT files must be under 2MB.", variant: "destructive" });
      return;
    }
    const text = await file.text();
    setTranscript(srtToText(text));
    toast({ title: "Transcript loaded", description: `Imported from ${file.name}` });
    if (srtInputRef.current) srtInputRef.current.value = "";
  };

  const togglePlayer = (player: string) => {
    setSelectedPlayers(prev => 
      prev.includes(player) 
        ? prev.filter(p => p !== player)
        : [...prev, player]
    );
  };

  // Build list of past games grouped by date
  const pastGames = useMemo(() => {
    const gameMap = new Map<string, { date: string; gameNum: number; players: string[]; score: string; id: string }>();
    
    allGames.forEach(g => {
      const key = `${g.date}-${g.game}`;
      if (!gameMap.has(key)) {
        gameMap.set(key, {
          date: g.date,
          gameNum: g.game,
          players: [],
          score: g.score || '',
          id: key,
        });
      }
      gameMap.get(key)!.players.push(g.player);
    });

    return [...gameMap.values()]
      .sort((a, b) => b.date.localeCompare(a.date) || b.gameNum - a.gameNum)
      .slice(0, 50); // Limit to last 50 games
  }, [allGames]);

  const handleSubmit = async () => {
    if (!video) return;

    setIsSubmitting(true);

    const gameId = selectedGameId === "none" ? null : selectedGameId;
    // Determine video_type based on game assignment
    const videoType = gameId ? 'highlight' : video.video_type;

    const { error } = await supabase
      .from('videos')
      .update({
        title,
        description: description || null,
        players: selectedPlayers,
        game_id: gameId && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(gameId) ? gameId : null,
        video_type: videoType,
        transcript: transcript.trim() || null,
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
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
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

          {/* Assign to Game */}
          <div>
            <Label className="text-muted-foreground">Link to Game</Label>
            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select a game..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-48">
                <SelectItem value="none">No game linked</SelectItem>
                {pastGames.map(game => (
                  <SelectItem key={game.id} value={game.id}>
                    {format(parseISO(game.date), 'MMM d')} - Game {game.gameNum} ({game.players.slice(0, 4).join(', ')}) {game.score}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Featured Players */}
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

          {/* Transcript — paste text or upload SRT (searchable from the Videos search bar) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Transcript
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => srtInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-1" /> Upload .srt
              </Button>
              <input
                ref={srtInputRef}
                type="file"
                accept=".srt,text/plain"
                onChange={handleSrtUpload}
                className="hidden"
              />
            </div>
            <Textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste transcript text here, or upload an .srt file…"
              className="bg-muted border-border min-h-[120px] text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Transcripts are searchable from the Videos page search bar.
            </p>
          </div>

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
