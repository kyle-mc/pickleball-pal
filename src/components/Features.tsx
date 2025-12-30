import { MapPin, Users, Trophy, Calendar, TrendingUp, Zap } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Court Finder",
    description: "Discover pickleball courts near you with real-time availability and ratings from the community.",
    color: "primary" as const,
  },
  {
    icon: Users,
    title: "Match Making",
    description: "Connect with players at your skill level. Join open games or create your own matches.",
    color: "accent" as const,
  },
  {
    icon: Trophy,
    title: "Tournaments",
    description: "Browse and register for local tournaments. Track brackets and results in real-time.",
    color: "primary" as const,
  },
  {
    icon: Calendar,
    title: "Book Courts",
    description: "Reserve courts ahead of time. Never miss your game with smart scheduling.",
    color: "accent" as const,
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Log your matches, track your wins, and watch your skill rating climb over time.",
    color: "primary" as const,
  },
  {
    icon: Zap,
    title: "Quick Play",
    description: "Jump into pickup games instantly. Get matched with available players nearby.",
    color: "accent" as const,
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-widest mb-4 block">Features</span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            EVERYTHING YOU NEED TO
            <span className="text-gradient-primary block">DOMINATE THE COURT</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From finding your next game to tracking your improvement, we've got every aspect of your pickleball journey covered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-gradient-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                feature.color === 'primary' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-accent/20 text-accent'
              }`}>
                <feature.icon size={28} />
              </div>
              <h3 className="font-display text-2xl text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
