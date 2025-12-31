import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Clock, Eye } from "lucide-react";

const Videos = () => {
  const videos = [
    { id: 1, title: "Pro Tips: The Perfect Dink", duration: "8:24", views: "2.4K", thumbnail: "🎾" },
    { id: 2, title: "Third Shot Drop Mastery", duration: "12:15", views: "1.8K", thumbnail: "🏓" },
    { id: 3, title: "Doubles Strategy Guide", duration: "15:30", views: "3.1K", thumbnail: "👥" },
    { id: 4, title: "Serve Techniques That Win", duration: "10:45", views: "2.9K", thumbnail: "🎯" },
    { id: 5, title: "Kitchen Line Domination", duration: "9:20", views: "1.5K", thumbnail: "🔥" },
    { id: 6, title: "Match Analysis: Pro Finals", duration: "22:10", views: "4.2K", thumbnail: "🏆" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">Videos</h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="bg-card/50 border-border overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors">
                <div className="aspect-video bg-muted/30 flex items-center justify-center relative">
                  <span className="text-6xl">{video.thumbnail}</span>
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary-foreground ml-1" />
                    </div>
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
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Videos;
