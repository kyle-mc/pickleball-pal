import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LogIn, Trophy, TrendingUp, Shield, Calendar, Users,
  MapPin, Zap, BarChart3, Star, ChevronRight,
} from "lucide-react";
import logo from "@/assets/logo.png";
import AuthDialog from "@/components/AuthDialog";

type Props = { openAuth: (mode: "signin" | "signup") => void };

// ─── Shared Feature Cards ────────────────────────────────────────────────────
const FeatureCard = ({
  icon, title, description,
}: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group">
    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
      {icon}
    </div>
    <h3 className="font-display text-xl text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

const Nav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto px-4 h-16 flex items-center gap-2">
      <img src={logo} alt="PicklePlay" className="w-10 h-10 rounded-full object-cover" />
      <span className="font-display text-2xl text-foreground tracking-wide">PICKLEPLAY</span>
    </div>
  </nav>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN 1 — Bold & Energetic
// Two-column layout, giant stacked typography, live stats card mock-up
// ═══════════════════════════════════════════════════════════════════════════════
const Design1 = ({ openAuth }: Props) => (
  <main className="min-h-screen bg-background">
    <Nav />

    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero pt-16">
      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-40 w-[700px] h-[900px] bg-primary/6 rotate-12 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-accent/5 blur-3xl" />
        {/* Court */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] opacity-[0.07]">
          <div className="w-[800px] h-[400px] border-4 border-foreground rounded-lg" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] border-2 border-foreground" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-[300px] bg-foreground" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10 py-12">
        <div className="grid xl:grid-cols-[1fr_360px] gap-16 items-center max-w-6xl mx-auto">
          {/* Left */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-semibold uppercase tracking-[0.15em]">KC Pickleballers Official</span>
            </div>
            <h1 className="font-display text-[clamp(5rem,14vw,11rem)] text-foreground leading-[0.88] mb-8 -ml-1">
              PLAY.<br />
              <span className="text-gradient-primary">RANK.</span><br />
              <span className="text-gradient-accent">WIN.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed font-body">
              The official MMR tracker for KC Pickleballers. Log games, climb the ranks, and see exactly where you stand.
            </p>
            <Button
              variant="hero" size="xl"
              onClick={() => openAuth("signin")}
              className="text-xl px-14 py-7"
            >
              <LogIn className="mr-2" size={22} />
              Login to Your Account
            </Button>
          </div>

          {/* Right — mock stats card */}
          <div className="hidden xl:block animate-slide-up animation-delay-400">
            <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Your MMR</span>
                <span className="text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">Season 3</span>
              </div>
              <div className="font-display text-[4.5rem] text-foreground leading-none">1,847</div>
              <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                +124 this season
              </div>
              <div className="h-px bg-border" />
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: "68%", l: "Win Rate", c: "text-foreground" },
                  { v: "Gold", l: "Rank", c: "text-accent" },
                  { v: "42", l: "Games", c: "text-foreground" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className={`font-display text-2xl ${s.c}`}>{s.v}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
              {/* rank bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Gold → Platinum</span>
                  <span>73 / 100 pts</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[73%] bg-primary rounded-full animate-pulse-glow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Stats bar */}
    <div className="bg-card border-y border-border py-5">
      <div className="container mx-auto px-4 grid grid-cols-3 gap-4 text-center">
        {[
          { v: "100+", l: "Ranked Players", c: "text-primary" },
          { v: "5K+", l: "Games Logged", c: "text-accent" },
          { v: "Glicko-2", l: "Rating System", c: "text-foreground" },
        ].map((s) => (
          <div key={s.l}>
            <div className={`font-display text-3xl ${s.c}`}>{s.v}</div>
            <div className="text-sm text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </div>

    <section className="py-24 bg-card/20">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-4xl md:text-5xl text-center text-foreground mb-16">EVERYTHING YOU NEED</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon={<Trophy className="w-7 h-7" />} title="MMR Tracking" description="Track your rating over time with detailed game history and performance analytics." />
          <FeatureCard icon={<Users className="w-7 h-7" />} title="Private Group" description="Your stats stay within KC Pickleballers — no public leaderboards." />
          <FeatureCard icon={<TrendingUp className="w-7 h-7" />} title="Head-to-Head" description="Compare your performance against any player with detailed matchup analysis." />
          <FeatureCard icon={<Calendar className="w-7 h-7" />} title="Events" description="Organize games, track RSVPs, and never miss a session." />
          <FeatureCard icon={<Shield className="w-7 h-7" />} title="Claim History" description="Link your account to existing records and keep all your historical stats." />
          <FeatureCard icon={<MapPin className="w-7 h-7" />} title="Profiles" description="Share your DUPR rating, paddles, and play style with your community." />
        </div>
      </div>
    </section>

    <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
      © 2024 PicklePlay · Built for KC Pickleballers
    </footer>
  </main>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN 2 — Clean & Minimal
// Centered, airy, logo-forward — the "less is more" take
// ═══════════════════════════════════════════════════════════════════════════════
const Design2 = ({ openAuth }: Props) => (
  <main className="min-h-screen bg-background flex flex-col">
    <Nav />

    {/* Hero — centered, spacious */}
    <section className="flex-1 flex items-center justify-center pt-16 px-4 min-h-screen">
      <div className="max-w-xl mx-auto text-center space-y-10 animate-slide-up">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="PicklePlay"
            className="w-28 h-28 rounded-3xl object-cover shadow-2xl ring-1 ring-primary/20"
          />
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-6xl md:text-7xl text-foreground leading-tight">
            Your pickleball.
            <br />
            <span className="text-gradient-primary">Quantified.</span>
          </h1>
          <p className="text-muted-foreground text-lg font-body max-w-xs mx-auto leading-relaxed">
            MMR tracking and group stats for Kansas City's best players.
          </p>
        </div>

        <Button
          variant="hero" size="xl"
          onClick={() => openAuth("signin")}
          className="text-lg px-16 py-6"
        >
          <LogIn className="mr-2" size={20} />
          Login
        </Button>

        {/* Simple stat row */}
        <div className="flex items-center justify-center gap-8 pt-2">
          {[
            { v: "100+", l: "Players" },
            { v: "5K+", l: "Games" },
            { v: "S3", l: "Season" },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center gap-8">
              {i > 0 && <div className="w-px h-8 bg-border" />}
              <div className="text-center">
                <div className="font-display text-2xl text-foreground">{s.v}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Feature grid — clean tiles */}
    <section className="border-t border-border py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">
          {[
            { icon: <Trophy className="w-4 h-4" />, t: "MMR Tracking", d: "Glicko-2 rating system" },
            { icon: <TrendingUp className="w-4 h-4" />, t: "Performance Analytics", d: "Win rates, streaks, trends" },
            { icon: <Users className="w-4 h-4" />, t: "Group Leaderboard", d: "Private to KC Pickleballers" },
            { icon: <Calendar className="w-4 h-4" />, t: "Event Scheduling", d: "RSVPs and session management" },
            { icon: <BarChart3 className="w-4 h-4" />, t: "Head-to-Head Records", d: "Detailed matchup analysis" },
            { icon: <Shield className="w-4 h-4" />, t: "Claim Your Stats", d: "Link to existing records" },
          ].map((f) => (
            <div key={f.t} className="bg-card p-5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {f.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{f.t}</div>
                <div className="text-xs text-muted-foreground">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <footer className="py-6 border-t border-border text-center text-xs text-muted-foreground">
      © 2024 PicklePlay
    </footer>
  </main>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN 3 — Dark & Premium
// Full-dark grid, dramatic typography, rank tiers on display
// ═══════════════════════════════════════════════════════════════════════════════
const Design3 = ({ openAuth }: Props) => (
  <main className="min-h-screen bg-background relative overflow-hidden">
    {/* Grid pattern */}
    <div className="fixed inset-0 pointer-events-none">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.04) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/6 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/4 rounded-full blur-[120px]" />
    </div>

    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/15 bg-background/90 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center gap-2">
        <img src={logo} alt="PicklePlay" className="w-9 h-9 rounded-lg object-cover" />
        <span className="font-display text-xl tracking-widest text-foreground">PICKLEPLAY</span>
      </div>
    </nav>

    <section className="relative min-h-screen flex items-center justify-center pt-16 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-10 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-primary uppercase tracking-[0.2em] font-semibold">KC Pickleballers · Season 3 Live</span>
        </div>

        <h1 className="font-display leading-[0.88]">
          <div className="text-[clamp(4rem,11vw,9rem)] text-foreground">RISE</div>
          <div className="text-[clamp(4rem,11vw,9rem)] text-foreground">THROUGH</div>
          <div className="text-[clamp(4rem,11vw,9rem)] text-gradient-primary">THE RANKS</div>
        </h1>

        <p className="text-lg text-muted-foreground max-w-lg mx-auto font-body leading-relaxed">
          Precision MMR tracking for serious pickleball players. Know exactly where you stand — and what it takes to climb.
        </p>

        <div className="flex justify-center">
          <Button
            variant="hero" size="xl"
            onClick={() => openAuth("signin")}
            className="text-xl px-16 py-8"
          >
            <LogIn className="mr-3" size={24} />
            Login
          </Button>
        </div>

        {/* Rank tiers */}
        <div className="flex justify-center gap-2 pt-4 flex-wrap">
          {[
            { r: "Bronze", active: false },
            { r: "Silver", active: false },
            { r: "Gold", active: true },
            { r: "Platinum", active: false },
            { r: "Diamond", active: false },
          ].map((rank) => (
            <div
              key={rank.r}
              className={`px-4 py-2 rounded-full border font-display text-sm transition-all ${
                rank.active
                  ? "border-accent/50 text-accent bg-accent/10 shadow-[0_0_20px_hsl(var(--accent)/0.2)]"
                  : "border-border text-muted-foreground bg-card/50"
              }`}
            >
              {rank.r}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="relative py-24 border-t border-primary/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: <TrendingUp className="w-6 h-6" />,
              t: "MMR Tracking",
              d: "Glicko-2 algorithm tracks every game with mathematical precision.",
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              t: "Deep Analytics",
              d: "Head-to-head records, win rates, and historical rating trends.",
            },
            {
              icon: <Trophy className="w-6 h-6" />,
              t: "Rank System",
              d: "Five tiers from Bronze to Diamond. Every game moves the needle.",
            },
          ].map((f) => (
            <div
              key={f.t}
              className="p-6 rounded-xl border border-primary/10 bg-primary/[0.03] hover:border-primary/30 hover:bg-primary/[0.06] transition-all group"
            >
              <div className="w-12 h-12 rounded-lg border border-primary/20 bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:border-primary/40 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <footer className="relative py-8 border-t border-primary/10 text-center text-sm text-muted-foreground">
      © 2024 PicklePlay · KC Pickleballers
    </footer>
  </main>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN 4 — Community & Warm
// KC Pickleballers front and center, personal welcome, social proof
// ═══════════════════════════════════════════════════════════════════════════════
const Design4 = ({ openAuth }: Props) => (
  <main className="min-h-screen bg-background">
    <Nav />

    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[1400px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
        {/* Court faint */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] opacity-[0.05]">
          <div className="w-[800px] h-[400px] border-4 border-foreground rounded-lg" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] border-2 border-foreground" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-[300px] bg-foreground" />
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center animate-slide-up">
        <div className="flex justify-center mb-8">
          <img
            src={logo}
            alt="KC Pickleballers"
            className="w-24 h-24 rounded-2xl object-cover shadow-2xl ring-4 ring-primary/20"
          />
        </div>

        <h1 className="font-display text-6xl md:text-8xl text-foreground leading-tight mb-3">
          KC PICKLEBALLERS
        </h1>
        <h2 className="font-display text-3xl md:text-4xl text-gradient-primary mb-8">
          OFFICIAL STAT TRACKER
        </h2>

        <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed font-body">
          Track your MMR, challenge your friends, and see exactly how you rank among Kansas City's best pickleball players.
        </p>

        <Button
          variant="hero" size="xl"
          onClick={() => openAuth("signin")}
          className="text-xl px-16 py-7"
        >
          <LogIn className="mr-2" size={22} />
          Login
        </Button>

        {/* Social proof */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-card/70 border border-border backdrop-blur">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D"].map((l) => (
                <div
                  key={l}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary"
                >
                  {l}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">100+</span> active players
            </span>
          </div>
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-card/70 border border-border backdrop-blur">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">5,000+</span> games tracked
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-accent animate-float hidden lg:block glow-accent" />
    </section>

    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-display text-4xl text-center text-foreground mb-12">BUILT FOR YOUR COMMUNITY</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: <Trophy className="w-6 h-6" />,
              t: "Competitive Rankings",
              d: "See where you stand in the KC Pickleballers pecking order with our Glicko-2 MMR system.",
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              t: "Track Your Progress",
              d: "Watch your MMR grow over time. Celebrate wins, learn from losses.",
            },
            {
              icon: <Calendar className="w-6 h-6" />,
              t: "Group Events",
              d: "Schedule sessions, collect RSVPs, and keep the whole group on the same page.",
            },
            {
              icon: <Shield className="w-6 h-6" />,
              t: "Your Stats, Your History",
              d: "Claim your player record and own every game you've ever played.",
            },
          ].map((f) => (
            <div key={f.t} className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground mb-1">{f.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Bottom CTA */}
    <section className="py-20 text-center px-4 border-t border-border">
      <h2 className="font-display text-4xl md:text-5xl text-foreground mb-6">READY TO COMPETE?</h2>
      <p className="text-muted-foreground mb-10 max-w-md mx-auto font-body">Log in and see where you rank among KC's best.</p>
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
  </main>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Root — design switcher
// ═══════════════════════════════════════════════════════════════════════════════
const Landing = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [design, setDesign] = useState<1 | 2 | 3 | 4>(1);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthDialogOpen(true);
  };

  const designs: { id: 1 | 2 | 3 | 4; label: string }[] = [
    { id: 1, label: "Bold" },
    { id: 2, label: "Minimal" },
    { id: 3, label: "Premium" },
    { id: 4, label: "Community" },
  ];

  return (
    <>
      {/* Floating design picker */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1.5 bg-card/95 backdrop-blur-xl border border-border rounded-full px-4 py-2.5 shadow-2xl">
        <span className="text-xs text-muted-foreground font-medium mr-2">Design:</span>
        {designs.map((d) => (
          <button
            key={d.id}
            onClick={() => setDesign(d.id)}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              design === d.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {design === 1 && <Design1 openAuth={openAuth} />}
      {design === 2 && <Design2 openAuth={openAuth} />}
      {design === 3 && <Design3 openAuth={openAuth} />}
      {design === 4 && <Design4 openAuth={openAuth} />}

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultMode={authMode}
      />
    </>
  );
};

export default Landing;
