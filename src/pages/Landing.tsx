import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LogIn, Trophy, TrendingUp, Shield, Calendar, Users,
  BarChart3, Star, Play, X,
} from "lucide-react";
import logo from "@/assets/logo.png";
import AuthDialog from "@/components/AuthDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Feature card data with video/detail info
const features = [
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "MMR Tracking",
    shortDesc: "Glicko-2 rating system",
    fullDesc: "Track your rating over time with our advanced Glicko-2 algorithm. Every game you play affects your MMR, and you can see exactly how your rating changes after each match.",
    videoPlaceholder: "See how your MMR updates after each game, with detailed breakdowns of rating changes.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Track Your Progress",
    shortDesc: "Win rates, streaks, trends",
    fullDesc: "Watch your performance improve over time with detailed analytics. View your win rate, current streak, and historical trends to understand your growth as a player.",
    videoPlaceholder: "Explore your personal dashboard with charts showing your rating history and performance metrics.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Group Leaderboard",
    shortDesc: "Private to KC Pickleballers",
    fullDesc: "See where you rank among all KC Pickleballers members. The leaderboard updates in real-time and shows everyone's current MMR, rank tier, and recent form.",
    videoPlaceholder: "Browse the standings page to see all players ranked by MMR with their tier badges.",
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    title: "Event Scheduling",
    shortDesc: "RSVPs and session management",
    fullDesc: "Never miss a game session. Create and join events, RSVP to upcoming matches, and see who else is playing. Perfect for organizing regular play sessions.",
    videoPlaceholder: "Check out the schedule view where you can see upcoming events and manage your RSVPs.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Head-to-Head Records",
    shortDesc: "Detailed matchup analysis",
    fullDesc: "Compare your performance against any other player. See your win/loss record, average point differential, and recent match history against specific opponents.",
    videoPlaceholder: "Use the head-to-head comparison tool to analyze your matchups with other players.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Claim Your Stats",
    shortDesc: "Link to existing records",
    fullDesc: "Already have games in the system? Link your account to your existing player record and claim all your historical stats. Your complete game history, all in one place.",
    videoPlaceholder: "Walk through the profile setup process where you can link your account to existing game records.",
  },
];

type FeatureDialogProps = {
  feature: typeof features[0] | null;
  open: boolean;
  onClose: () => void;
};

const FeatureDialog = ({ feature, open, onClose }: FeatureDialogProps) => {
  if (!feature) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {feature.icon}
            </div>
            <DialogTitle className="font-display text-2xl">{feature.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            {feature.fullDesc}
          </DialogDescription>
        </DialogHeader>
        
        {/* Video placeholder */}
        <div className="mt-4 rounded-xl bg-muted/50 border border-border overflow-hidden">
          <div className="aspect-video flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-primary ml-1" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {feature.videoPlaceholder}
            </p>
            <span className="text-xs text-muted-foreground/60 mt-2">Video walkthrough coming soon</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Nav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto px-4 h-16 flex items-center gap-2">
      <img src={logo} alt="PicklePlay" className="w-10 h-10 rounded-full object-cover" />
      <span className="font-display text-2xl text-foreground tracking-wide">PICKLEPLAY</span>
    </div>
  </nav>
);

const Landing = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthDialogOpen(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 px-4">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-hero" />
          <div
            className="absolute inset-0 opacity-100"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/6 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/4 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center animate-slide-up">
          {/* Logo & Title */}
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="KC Pickleballers"
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-primary/20"
            />
          </div>

          {/* Badge with bullets */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary uppercase tracking-[0.15em] font-semibold">
              KC Pickleballers
            </span>
            <span className="text-primary/40">•</span>
            <span className="text-xs text-primary uppercase tracking-[0.15em] font-semibold">
              Season 2 Live
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-2">
            OFFICIAL STAT TRACKER
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed font-body">
            Precision stat tracking for serious pickleball players. MMR tracking and group stats for Kansas City's best players.
          </p>

          {/* CTA */}
          <Button
            variant="hero" size="xl"
            onClick={() => openAuth("signin")}
            className="text-xl px-16 py-7"
          >
            <LogIn className="mr-2" size={22} />
            Login
          </Button>
        </div>

        {/* Floating ball */}
        <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-accent animate-float hidden lg:block glow-accent" />
      </section>

      {/* Stats Bar */}
      <div className="bg-card border-y border-border py-5">
        <div className="container mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          {[
            { v: "100+", l: "Ranked Players", c: "text-primary" },
            { v: "5K+", l: "Games Logged", c: "text-accent" },
            { v: "S2", l: "Season", c: "text-foreground" },
          ].map((s) => (
            <div key={s.l}>
              <div className={`font-display text-3xl ${s.c}`}>{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section - Small clickable cards */}
      <section className="py-20 bg-card/20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-center text-foreground mb-12">
            EVERYTHING YOU NEED
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
              {features.map((f) => (
                <button
                  key={f.title}
                  onClick={() => setSelectedFeature(f)}
                  className="bg-card p-5 flex items-center gap-4 text-left hover:bg-primary/5 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {f.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{f.shortDesc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What is MMR Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
            WHAT IS MMR?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            <span className="text-foreground font-semibold">MMR (Matchmaking Rating)</span> is a numerical value that represents your skill level. We use the <span className="text-primary font-semibold">Glicko-2</span> rating system — the same algorithm used by chess federations and competitive games worldwide.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Your MMR changes based on game outcomes. Beat a higher-rated player? Big gains. Lose to someone lower-rated? Expect a dip. The system also factors in rating uncertainty, so new players can climb (or fall) quickly until their true skill level is established.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Bronze", "Silver", "Gold", "Platinum", "Diamond"].map((rank, i) => (
              <div
                key={rank}
                className={`px-4 py-2 rounded-full border text-sm font-medium ${
                  i === 2
                    ? "border-accent/50 text-accent bg-accent/10"
                    : "border-border text-muted-foreground bg-card/50"
                }`}
              >
                {rank}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Five rank tiers based on your MMR. Climb the ladder!
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 text-center px-4 border-t border-border bg-card/30">
        <h2 className="font-display text-4xl md:text-5xl text-foreground mb-6">READY TO COMPETE?</h2>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto font-body">
          Log in and see where you rank among KC's best.
        </p>
        <Button
          variant="hero" size="xl"
          onClick={() => openAuth("signin")}
          className="text-xl px-16 py-7"
        >
          <LogIn className="mr-2" size={22} />
          Login
        </Button>
      </section>

      <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
        © 2024 PicklePlay · Built for KC Pickleballers
      </footer>

      {/* Feature Detail Dialog */}
      <FeatureDialog
        feature={selectedFeature}
        open={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
      />

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultMode={authMode}
      />
    </main>
  );
};

export default Landing;
