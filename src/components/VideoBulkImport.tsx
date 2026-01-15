import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedVideo {
  title: string;
  description: string;
  youtube_url: string;
  duration: string;
  players: string[];
  video_date: string;
}

const VideoBulkImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [parsedVideos, setParsedVideos] = useState<ParsedVideo[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const parseInput = () => {
    const lines = rawInput.trim().split("\n").filter(line => line.trim());
    const videos: ParsedVideo[] = [];

    for (const line of lines) {
      // Split by tab (Google Sheets default) or comma
      const parts = line.includes("\t") ? line.split("\t") : line.split(",").map(p => p.trim());
      
      if (parts.length < 3) continue; // Need at least Title, Description, URL

      const [title, description, youtube_url, duration = "", playersStr = "", video_date = ""] = parts;

      // Parse players (comma-separated within the field)
      const players = playersStr
        .split(/[,;]/)
        .map(p => p.trim())
        .filter(Boolean);

      if (title && youtube_url) {
        videos.push({
          title: title.trim(),
          description: description?.trim() || "",
          youtube_url: youtube_url.trim(),
          duration: duration?.trim() || "",
          players,
          video_date: video_date?.trim() || new Date().toISOString().split("T")[0],
        });
      }
    }

    setParsedVideos(videos);
    
    if (videos.length === 0) {
      toast({
        title: "No videos found",
        description: "Please check your input format: Title, Description, YouTube URL, Duration, Players, Date",
        variant: "destructive",
      });
    } else {
      toast({
        title: `${videos.length} videos parsed`,
        description: "Review and click Import to add them.",
      });
    }
  };

  const handleImport = async () => {
    if (parsedVideos.length === 0) return;

    setIsImporting(true);
    try {
      const { error } = await supabase.from("videos").insert(
        parsedVideos.map(v => ({
          title: v.title,
          description: v.description || null,
          youtube_url: v.youtube_url,
          duration: v.duration || null,
          players: v.players.length > 0 ? v.players : null,
          video_date: v.video_date || null,
        }))
      );

      if (error) throw error;

      toast({
        title: "Import Successful!",
        description: `${parsedVideos.length} videos have been added.`,
      });

      queryClient.invalidateQueries({ queryKey: ["videos"] });
      setIsOpen(false);
      setRawInput("");
      setParsedVideos([]);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "There was an error importing videos.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Import Videos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-muted-foreground">
              Paste rows from Google Sheets (Tab or Comma separated)
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Format: Title, Description, YouTube URL, Duration, Players (comma-separated), Date
            </p>
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Amazing Rally	Great gameplay	https://youtu.be/abc123	3:45	Kyle, Chris, Brandon	2025-01-15"
              className="bg-muted border-border min-h-[150px] font-mono text-sm"
            />
          </div>

          <Button onClick={parseInput} variant="outline" className="w-full">
            Parse Input
          </Button>

          {parsedVideos.length > 0 && (
            <div className="space-y-3">
              <Label className="text-foreground">Preview ({parsedVideos.length} videos)</Label>
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {parsedVideos.map((video, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="font-medium text-foreground">{video.title}</div>
                    <div className="text-muted-foreground text-xs truncate">{video.youtube_url}</div>
                    {video.players.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {video.players.map((p, j) => (
                          <span key={j} className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    {video.video_date && (
                      <div className="text-xs text-muted-foreground mt-1">Date: {video.video_date}</div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleImport}
                variant="hero"
                className="w-full"
                disabled={isImporting}
              >
                {isImporting ? "Importing..." : `Import ${parsedVideos.length} Videos`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoBulkImport;
