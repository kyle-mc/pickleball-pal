import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Clock, Eye, Heart, Search, Filter, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoHighlight {
  id: number;
  title: string;
  description: string;
  players: string[];
  date: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  duration: string;
}

// Demo data - would be replaced by Google Sheets integration
const highlightVideos: VideoHighlight[] = [
  { id: 1, title: "Amazing ATP Winner!", description: "Kyle with an incredible around-the-post winner", players: ["Kyle", "Chris"], date: "2025-08-25", youtubeUrl: "https://youtube.com/watch?v=example1", views: 245, likes: 32, duration: "0:24" },
  { id: 2, title: "Insane Dink Rally", description: "30-shot dink rally ending in spectacular fashion", players: ["Josiah", "Brandon", "Chris", "Kyle"], date: "2025-08-18", youtubeUrl: "https://youtube.com/watch?v=example2", views: 189, likes: 28, duration: "1:12" },
  { id: 3, title: "Perfect Erne Execution", description: "Brandon with the textbook Erne", players: ["Brandon", "Corbin"], date: "2025-08-04", youtubeUrl: "https://youtube.com/watch?v=example3", views: 312, likes: 45, duration: "0:18" },
  { id: 4, title: "Comeback Win Celebration", description: "Team rallies from 8-2 down to win 11-9", players: ["Kyle", "Josiah"], date: "2025-09-01", youtubeUrl: "https://youtube.com/watch?v=example4", views: 421, likes: 67, duration: "2:45" },
  { id: 5, title: "Speed-up Battle", description: "Chris wins an intense hands battle at the kitchen", players: ["Chris", "Braden"], date: "2025-08-25", youtubeUrl: "https://youtube.com/watch?v=example5", views: 156, likes: 19, duration: "0:32" },
];

const tutorialVideos = [
  { id: 101, title: "Pro Tips: The Perfect Dink", duration: "8:24", views: "2.4K", thumbnail: "🎾", youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 102, title: "Third Shot Drop Mastery", duration: "12:15", views: "1.8K", thumbnail: "🏓", youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 103, title: "Doubles Strategy Guide", duration: "15:30", views: "3.1K", thumbnail: "👥", youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 104, title: "Serve Techniques That Win", duration: "10:45", views: "2.9K", thumbnail: "🎯", youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 105, title: "Kitchen Line Domination", duration: "9:20", views: "1.5K", thumbnail: "🔥", youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
  { id: 106, title: "Match Analysis: Pro Finals", duration: "22:10", views: "4.2K", thumbnail: "🏆", youtubeUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
];

const Videos = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());

  // Get unique players from highlights
  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    highlightVideos.forEach(v => v.players.forEach(p => players.add(p)));
    return [...players].sort();
  }, []);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let videos = [...highlightVideos];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      videos = videos.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.players.some(p => p.toLowerCase().includes(query))
      );
    }

    // Player filter
    if (playerFilter !== "all") {
      videos = videos.filter(v => v.players.includes(playerFilter));
    }

    // Sort
    switch (sortBy) {
      case "date":
        videos.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "views":
        videos.sort((a, b) => b.views - a.views);
        break;
      case "likes":
        videos.sort((a, b) => (b.likes + (likedVideos.has(b.id) ? 1 : 0)) - (a.likes + (likedVideos.has(a.id) ? 1 : 0)));
        break;
    }

    return videos;
  }, [searchQuery, playerFilter, sortBy, likedVideos]);

  const handleLike = (videoId: number) => {
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
        toast({ title: "Like removed" });
      } else {
        newSet.add(videoId);
        toast({ title: "Video liked!" });
      }
      return newSet;
    });
  };

  const handlePlayVideo = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Videos</h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search highlights..."
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

          {/* Recent Highlights */}
          <section className="mb-12">
            <h2 className="font-display text-2xl text-foreground mb-4">Recent Highlights</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Video data will be pulled from your Google Sheets spreadsheet once connected.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card 
                  key={video.id} 
                  className="bg-card/50 border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handlePlayVideo(video.youtubeUrl)}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                    <span className="text-6xl">🎬</span>
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs text-foreground">
                      {video.duration}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {video.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {video.players.map(player => (
                        <span key={player} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {player}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{video.views}</span>
                        </div>
                        <button 
                          className={`flex items-center gap-1 transition-colors ${likedVideos.has(video.id) ? "text-destructive" : "hover:text-destructive"}`}
                          onClick={e => { e.stopPropagation(); handleLike(video.id); }}
                        >
                          <Heart className="w-3 h-3" fill={likedVideos.has(video.id) ? "currentColor" : "none"} />
                          <span>{video.likes + (likedVideos.has(video.id) ? 1 : 0)}</span>
                        </button>
                      </div>
                      <span className="text-xs">{video.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVideos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No videos found matching your filters.
              </div>
            )}
          </section>

          {/* Tutorials & Pro Content */}
          <section>
            <h2 className="font-display text-2xl text-foreground mb-4">Tutorials & Pro Matches</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorialVideos.map((video) => (
                <Card 
                  key={video.id} 
                  className="bg-card/50 border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handlePlayVideo(video.youtubeUrl)}
                >
                  <div className="aspect-video bg-muted/30 flex items-center justify-center relative">
                    <span className="text-6xl">{video.thumbnail}</span>
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{video.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{video.views}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Videos;
