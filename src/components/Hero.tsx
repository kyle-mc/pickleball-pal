import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        {/* Court Lines Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] border-4 border-foreground rounded-lg" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] border-2 border-foreground" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-[300px] bg-foreground" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Join 50,000+ players nationwide</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground mb-6 animate-slide-up animation-delay-200 leading-tight">
            YOUR GAME.
            <br />
            <span className="text-gradient-primary">YOUR COURT.</span>
            <br />
            <span className="text-gradient-accent">YOUR COMMUNITY.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-400 font-body">
            Find courts, connect with players, track your progress, and elevate your pickleball game to the next level.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-600">
            <Button variant="hero" size="xl">
              Find Courts Near You
              <MapPin className="ml-2" size={20} />
            </Button>
            <Button variant="heroOutline" size="xl">
              Join a Match
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50 animate-slide-up animation-delay-600">
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl text-primary mb-1">15K+</div>
              <div className="text-sm text-muted-foreground">Courts Listed</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl text-accent mb-1">50K+</div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl text-foreground mb-1">2M+</div>
              <div className="text-sm text-muted-foreground">Matches Played</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Ball Animation */}
      <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-accent animate-float hidden lg:block glow-accent" />
    </section>
  );
};

export default Hero;
