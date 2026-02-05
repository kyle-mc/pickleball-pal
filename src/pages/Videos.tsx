import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye, Heart, Search, Filter, Plus, X, Video, Edit, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVideos, useUserLikes, useToggleLike } from "@/hooks/useVideos";
import { usePlayers } from "@/hooks/usePlayers";
import { AddVideoDialog } from "@/components/AddVideoDialog";
import { EditVideoDialog } from "@/components/EditVideoDialog";
import { VideoComments } from "@/components/VideoComments";
import VideoBulkImport from "@/components/VideoBulkImport";
import { MobileBottomNav } from "@/components/MobileBottomNav";

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

// Format duration from ISO 8601 or display stored duration
const formatDuration = (duration: string | null): string | null => {
  if (!duration) return null;
  // If it's already formatted (e.g., "3:45"), return as-is
  if (/^\d+:\d{2}$/.test(duration)) return duration;
  return duration;
};

interface VideoCardProps {
  video: ReturnType<typeof useVideos>['data'] extends (infer U)[] ? U : never;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

const VideoCard = ({ video, isLiked, onLike, onClick, onEdit }: VideoCardProps) => {
  const videoId = getYouTubeVideoId(video.youtube_url);
  const displayDuration = formatDuration(video.duration);
  
  return (
    <Card 
      className="bg-card/50 border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
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
        {video.game_id && (
          <div className="absolute top-2 left-2 bg-primary/90 px-2 py-1 rounded text-xs text-primary-foreground flex items-center gap-1">
            <Video className="w-3 h-3" />
            Game Clip
          </div>
        )}
        {/* Edit button */}
        <button
          onClick={onEdit}
          className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        >
          <Edit className="w-3 h-3 text-foreground" />
        </button>
        {displayDuration && (
          <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs text-foreground">
            {displayDuration}
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
              onClick={onLike}
            >
              <Heart className="w-3 h-3" fill={isLiked ? "currentColor" : "none"} />
              <span>{video.likes_count || 0}</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{video.comments_count || 0}</span>
            </div>
          </div>
          <span className="text-xs">
            {video.video_date || new Date(video.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const Videos = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: videos = [], isLoading } = useVideos();
  const { data: likedVideos = new Set<string>() } = useUserLikes();
  const toggleLikeMutation = useToggleLike();
  const { data: playersList = [] } = usePlayers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isAddHighlightOpen, setIsAddHighlightOpen] = useState(false);
  const [isAddOtherOpen, setIsAddOtherOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<typeof videos[0] | null>(null);

  // Separate videos by type
  const { highlights, otherVideos } = useMemo(() => {
    const highlights = videos.filter(v => v.video_type === 'highlight' || v.game_id);
    const otherVideos = videos.filter(v => v.video_type === 'other' && !v.game_id);
    return { highlights, otherVideos };
  }, [videos]);

  // Get unique players from videos and existing players
  const allPlayers = useMemo(() => {
    const playerSet = new Set<string>();
    videos.forEach(v => v.players?.forEach(p => playerSet.add(p)));
    playersList.forEach(p => playerSet.add(p));
    return [...playerSet].sort();
  }, [videos, playersList]);

  // Handle auto-play from URL query param and player filter
  useEffect(() => {
    const playId = searchParams.get('play');
    if (playId && videos.length > 0) {
      const videoExists = videos.some(v => v.id === playId);
      if (videoExists) {
        setSelectedVideo(playId);
        // Clear the query param after setting
        setSearchParams({}, { replace: true });
      }
    }
    
    // Handle player filter from URL (e.g., from My MMR page "Your Videos" link)
    const playerParam = searchParams.get('player');
    if (playerParam && allPlayers.includes(playerParam)) {
      setPlayerFilter(playerParam);
      // Clear the query param after setting
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, videos, setSearchParams, allPlayers]);

  // Filter and sort function
  const filterAndSort = (videoList: typeof videos) => {
    let filtered = [...videoList];

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
      case "comments":
        filtered.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
        break;
    }

    return filtered;
  };

  const filteredHighlights = useMemo(() => filterAndSort(highlights), [highlights, searchQuery, playerFilter, sortBy]);
  const filteredOther = useMemo(() => filterAndSort(otherVideos), [otherVideos, searchQuery, playerFilter, sortBy]);

  const handleLike = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLiked = likedVideos.has(videoId);
    toggleLikeMutation.mutate({ videoId, isLiked });
    toast({ title: isLiked ? "Like removed" : "Video liked!" });
  };

  const handleEdit = (video: typeof videos[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideo(video);
  };

  const selectedVideoData = videos.find(v => v.id === selectedVideo);
  const selectedVideoYouTubeId = selectedVideoData ? getYouTubeVideoId(selectedVideoData.youtube_url) : null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground flex-1">Videos</h1>
            <VideoBulkImport />
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
                <SelectItem value="comments">Most Comments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Highlights Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display text-foreground">🎬 Game Highlights</h2>
                <p className="text-sm text-muted-foreground">Clips from our games</p>
              </div>
              <Button variant="hero" onClick={() => setIsAddHighlightOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Game Highlight
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading videos...</div>
            ) : filteredHighlights.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHighlights.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isLiked={likedVideos.has(video.id)}
                    onLike={(e) => handleLike(video.id, e)}
                    onClick={() => setSelectedVideo(video.id)}
                    onEdit={(e) => handleEdit(video, e)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card/30 rounded-lg border border-border">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No highlights yet. Add your first game clip!</p>
                <Button variant="outline" onClick={() => setIsAddHighlightOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Highlight
                </Button>
              </div>
            )}
          </section>

          {/* Other Videos Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display text-foreground">📺 Other Videos</h2>
                <p className="text-sm text-muted-foreground">Tutorials, pro highlights, and more</p>
              </div>
              <Button variant="outline" onClick={() => setIsAddOtherOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading videos...</div>
            ) : filteredOther.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOther.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isLiked={likedVideos.has(video.id)}
                    onLike={(e) => handleLike(video.id, e)}
                    onClick={() => setSelectedVideo(video.id)}
                    onEdit={(e) => handleEdit(video, e)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card/30 rounded-lg border border-border">
                <p className="text-muted-foreground mb-4">No other videos yet.</p>
                <Button variant="outline" onClick={() => setIsAddOtherOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="bg-card border-border max-w-4xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {selectedVideoData && (
            <div>
              <div className="aspect-video bg-black">
                {selectedVideoYouTubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideoYouTubeId}?autoplay=1`}
                    title={selectedVideoData.title}
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
              <div className="p-4 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">{selectedVideoData.title}</h2>
                  {selectedVideoData.description && (
                    <p className="text-muted-foreground mb-3">{selectedVideoData.description}</p>
                  )}
                  {selectedVideoData.players && selectedVideoData.players.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedVideoData.players.map(player => (
                        <span key={player} className="text-sm bg-muted px-3 py-1 rounded-full text-muted-foreground">
                          {player}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedVideoData.views || 0} views</span>
                    </div>
                    <button 
                      className={`flex items-center gap-1 transition-colors ${likedVideos.has(selectedVideoData.id) ? "text-destructive" : "hover:text-destructive"}`}
                      onClick={(e) => handleLike(selectedVideoData.id, e)}
                    >
                      <Heart className="w-4 h-4" fill={likedVideos.has(selectedVideoData.id) ? "currentColor" : "none"} />
                      <span>{selectedVideoData.likes_count || 0} likes</span>
                    </button>
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="border-t border-border pt-4">
                  <VideoComments videoId={selectedVideoData.id} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Video Dialogs */}
      <AddVideoDialog 
        open={isAddHighlightOpen} 
        onOpenChange={setIsAddHighlightOpen}
        defaultVideoType="highlight"
      />
      <AddVideoDialog 
        open={isAddOtherOpen} 
        onOpenChange={setIsAddOtherOpen}
        defaultVideoType="other"
      />

      {/* Edit Video Dialog */}
      <EditVideoDialog
        open={!!editingVideo}
        onOpenChange={(open) => !open && setEditingVideo(null)}
        video={editingVideo}
      />

      <Footer />
      <MobileBottomNav />
    </main>
  );
};

export default Videos;