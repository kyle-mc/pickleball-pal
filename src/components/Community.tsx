import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Award, Calendar } from "lucide-react";

const Community = () => {
  return (
    <section id="community" className="py-24 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest mb-4 block">Community</span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            PLAY TOGETHER.
            <span className="text-gradient-primary block">GROW TOGETHER.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Join a vibrant community of pickleball enthusiasts. Share tips, celebrate wins, and make lifelong friends on and off the court.
          </p>
        </div>

        {/* Community Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-card rounded-2xl p-8 border border-border text-center group hover:border-primary/50 transition-all">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle size={32} />
            </div>
            <h3 className="font-display text-2xl text-foreground mb-3">Active Forums</h3>
            <p className="text-muted-foreground mb-4">
              Discuss strategies, gear reviews, and connect with players from around the world.
            </p>
            <span className="text-primary font-semibold">10,000+ daily posts</span>
          </div>

          <div className="bg-gradient-card rounded-2xl p-8 border border-border text-center group hover:border-accent/50 transition-all">
            <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Award size={32} />
            </div>
            <h3 className="font-display text-2xl text-foreground mb-3">Leaderboards</h3>
            <p className="text-muted-foreground mb-4">
              Compete for the top spots. Track rankings by region, skill level, or age group.
            </p>
            <span className="text-accent font-semibold">Updated in real-time</span>
          </div>

          <div className="bg-gradient-card rounded-2xl p-8 border border-border text-center group hover:border-primary/50 transition-all">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Calendar size={32} />
            </div>
            <h3 className="font-display text-2xl text-foreground mb-3">Events</h3>
            <p className="text-muted-foreground mb-4">
              Discover local meetups, clinics, and social events happening in your area.
            </p>
            <span className="text-primary font-semibold">500+ monthly events</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="accent" size="xl">
            Join the Community
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Community;
