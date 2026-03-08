import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, MapPin, Users, Trophy, TrendingUp, Shield, Calendar } from "lucide-react";
import logo from "@/assets/logo.png";
import AuthDialog from "@/components/AuthDialog";

const Landing = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthDialogOpen(true);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={logo} alt="PicklePlay Logo" className="w-10 h-10 rounded-full object-cover" />
              <span className="font-display text-2xl text-foreground tracking-wide">PICKLEPLAY</span>
            </div>
            <Button variant="default" size="lg" onClick={() => openAuth("signin")} className="text-base font-semibold px-8">
              <LogIn className="mr-2" size={20} />
              Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
              <span className="text-sm text-muted-foreground">Private group-based pickleball tracking</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground mb-6 animate-slide-up animation-delay-200 leading-tight">
              YOUR GAME.
              <br />
              <span className="text-gradient-primary">YOUR GROUP.</span>
              <br />
              <span className="text-gradient-accent">YOUR STATS.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-400 font-body">
              Track your MMR, compete with your group, and watch your pickleball game improve over time. Private, secure, and built for serious players.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-600">
              <Button variant="hero" size="xl" onClick={() => openAuth("signup")}>
                Create Your Group
                <Users className="ml-2" size={20} />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={() => openAuth("signin")}>
                Join Existing Group
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Ball Animation */}
        <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full bg-accent animate-float hidden lg:block glow-accent" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-4xl md:text-5xl text-center text-foreground mb-16">
            EVERYTHING YOU NEED
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Trophy className="w-8 h-8" />}
              title="MMR Tracking"
              description="Track your matchmaking rating over time with detailed game history and performance analytics."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Private Groups"
              description="Create or join private groups. Your stats stay within your group - no public leaderboards."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Head-to-Head Stats"
              description="Compare your performance against any player in your group with detailed matchup analysis."
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Event Scheduling"
              description="Organize games, track RSVPs, and never miss a session with your group."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Claim Your History"
              description="Link your account to existing player records and keep all your historical stats."
            />
            <FeatureCard
              icon={<MapPin className="w-8 h-8" />}
              title="Player Profiles"
              description="Share your DUPR rating, paddles, play style, and connect with your community."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 PicklePlay. Built for the pickleball community.</p>
        </div>
      </footer>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultMode={authMode}
      />
    </main>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => (
  <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group">
    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
      {icon}
    </div>
    <h3 className="font-display text-xl text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Landing;
