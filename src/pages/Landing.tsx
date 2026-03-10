import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LogIn, Trophy, TrendingUp, Calendar, Users,
  BarChart3, Video, Zap,
} from "lucide-react";
import logo from "@/assets/logo.png";
import AuthDialog from "@/components/AuthDialog";
import { TIERS, TIER_ICONS, TIER_COLORS, TIER_BG_COLORS } from "@/lib/ranks";
import { VICTORY_TYPES } from "@/lib/victoryTypes";

const features = [
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "MMR Tracking",
    shortDesc: "Glicko-2 rating system",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Victory Types",
    shortDesc: "Earn bonus MMR for dominant wins like 🥒 Golden Pickle (11-0) or 🔥 Clutch God (OT win)",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Group Leaderboard",
    shortDesc: "Standings, streaks, points scored, game history",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Head-to-Head Records",
    shortDesc: "Detailed matchup analysis",
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    title: "Event Scheduling",
    shortDesc: "RSVPs and session management",
  },
  {
    icon: <Video className="w-5 h-5" />,
    title: "Game Videos",
    shortDesc: "Upload highlights and save your best shots",
  },
];

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
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="KC Pickleballers"
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl ring-4 ring-primary/20"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary uppercase tracking-[0.15em] font-semibold whitespace-nowrap">
              KC Pickleballers • Season 2 Live
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-2">
            RISE THROUGH THE RANKS
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed font-body">
            Precision stat tracking for serious pickleball players. Earn your bragging rights, settle debates with data, and post the video evidence of your nastiest shots.
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

      {/* Features Section - Non-clickable cards */}
      <section className="py-20 bg-card/20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-center text-foreground mb-12">
            EVERYTHING YOU NEED
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-card p-5 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {f.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{f.shortDesc}</div>
                  </div>
                </div>
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

          {/* Horizontal rank chart */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max justify-center">
              {TIERS.map((tier) => {
                const icon = TIER_ICONS[tier.tier];
                return (
                  <div
                    key={tier.tier}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg ${TIER_BG_COLORS[tier.tier]} min-w-[80px]`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className={`text-xs font-semibold ${TIER_COLORS[tier.tier]}`}>
                      {tier.label === "GC" ? "Grand Champ" : tier.label === "SSL" ? "SSL" : tier.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {tier.minMmr}+
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            8 rank tiers across 22 divisions based on your MMR. Climb the ladder!
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

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultMode={authMode}
      />
    </main>
  );
};

export default Landing;
