import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye, Heart, Search, Filter, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVideos, useUserLikes, useToggleLike, useAddVideo } from "@/hooks/useVideos";
import { usePlayers } from "@/hooks/usePlayers";
import VideoBulkImport from "@/components/VideoBulkImport";
import { usePlayers } from "@/hooks/usePlayers";

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Helper to get YouTube thumbnail
const getYouTubeThumbnail = (url: string): string => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};

const Videos = () => {
  const { toast } = useToast();
  const { data: videos = [], isLoading } = useVideos();
  const { data: likedVideos = new Set<string>() } = useUserLikes();
  const toggleLikeMutation = useToggleLike();
  const addVideoMutation = useAddVideo();
  const { data: playersList = [] } = usePlayers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    youtube_url: "",
    duration: "",
    players: [] as string[],
  });

  // Get unique players from videos and existing players
  const allPlayers = useMemo(() => {
    const playerSet = new Set<string>();
    videos.forEach(v => v.players?.forEach(p => playerSet.add(p)));
    playersList.forEach(p => playerSet.add(p));
    return [...playerSet].sort();
  }, [videos, playersList]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let filtered = [...videos];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        v.players?.some(p => p.toLowerCase().includes(query))
      );
    }

    if (playerFilter !== "all") {
      filtered = filtered.filter(v => v.players?.includes(playerFilter));
    }

    switch (sortBy) {
      case "date":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "views":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "likes":
        filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
    }

    return filtered;
  }, [videos, searchQuery, playerFilter, sortBy]);

  const handleLike = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLiked = likedVideos.has(videoId);
    toggleLikeMutation.mutate({ videoId, isLiked });
    toast({ title: isLiked ? "Like removed" : "Video liked!" });
  };

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.youtube_url) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    const videoId = getYouTubeVideoId(newVideo.youtube_url);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    await addVideoMutation.mutateAsync({
      title: newVideo.title,
      description: newVideo.description || undefined,
      youtube_url: newVideo.youtube_url,
      players: newVideo.players.length > 0 ? newVideo.players : undefined,
    });

    setNewVideo({ title: "", description: "", youtube_url: "", duration: "", players: [] });
    setIsAddOpen(false);
    toast({ title: "Video Added!", description: "Your video has been added to the library." });
  };

  const togglePlayerSelection = (player: string) => {
    setNewVideo(prev => ({
      ...prev,
      players: prev.players.includes(player) 
        ? prev.players.filter(p => p !== player)
        : [...prev.players, player]
    }));
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground flex-1">Videos</h1>
            <VideoBulkImport />
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add Video</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className="text-muted-foreground">YouTube URL *</Label>
                    <Input
                      value={newVideo.youtube_url}
                      onChange={e => setNewVideo(prev => ({ ...prev, youtube_url: e.target.value }))}
                      placeholder="https://youtu.be/yNuuk4doHlA"
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Title *</Label>
                    <Input
                      value={newVideo.title}
                      onChange={e => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Amazing Rally!"
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <Input
                      value={newVideo.description}
                      onChange={e => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Incredible comeback in the finals..."
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Featured Players</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allPlayers.map(player => (
                        <button
                          key={player}
                          onClick={() => togglePlayerSelection(player)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            newVideo.players.includes(player)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {player}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAddVideo} className="w-full" variant="hero" disabled={addVideoMutation.isPending}>
                    {addVideoMutation.isPending ? "Adding..." : "Add Video"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search videos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <Select value={playerFilter} onValueChange={setPlayerFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by player" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Players</SelectItem>
                {allPlayers.map(player => (
                  <SelectItem key={player} value={player}>{player}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] bg-card border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="date">Most Recent</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading videos...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => {
                const videoId = getYouTubeVideoId(video.youtube_url);
                const isLiked = likedVideos.has(video.id);
                
                return (
                  <Card 
                    key={video.id} 
                    className="bg-card/50 border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedVideo(video.id)}
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {videoId ? (
                        <img 
                          src={video.thumbnail_url || getYouTubeThumbnail(video.youtube_url)}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl">🎬</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                          <svg className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs text-foreground">
                          {video.duration}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      {video.players && video.players.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {video.players.map(player => (
                            <span key={player} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {player}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{video.views || 0}</span>
                          </div>
                          <button 
                            className={`flex items-center gap-1 transition-colors ${isLiked ? "text-destructive" : "hover:text-destructive"}`}
                            onClick={e => handleLike(video.id, e)}
                          >
                            <Heart className="w-3 h-3" fill={isLiked ? "currentColor" : "none"} />
                            <span>{video.likes_count || 0}</span>
                          </button>
                        </div>
                        <span className="text-xs">
                          {video.video_date || new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && filteredVideos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No videos found. Add your first video!
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="bg-card border-border max-w-4xl p-0 overflow-hidden">
          <button 
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedVideo && (() => {
            const video = videos.find(v => v.id === selectedVideo);
            if (!video) return null;
            const videoId = getYouTubeVideoId(video.youtube_url);
            
            return (
              <div>
                <div className="aspect-video bg-black">
                  {videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Invalid video URL
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-foreground mb-2">{video.title}</h2>
                  {video.description && (
                    <p className="text-muted-foreground mb-3">{video.description}</p>
                  )}
                  {video.players && video.players.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {video.players.map(player => (
                        <span key={player} className="text-sm bg-muted px-3 py-1 rounded-full text-muted-foreground">
                          {player}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
};

export default Videos;
