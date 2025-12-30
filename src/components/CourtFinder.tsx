import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, Users } from "lucide-react";

const courts = [
  {
    name: "Sunset Recreation Center",
    location: "San Francisco, CA",
    rating: 4.8,
    courts: 6,
    availability: "Open Now",
    distance: "0.8 mi",
  },
  {
    name: "Golden Gate Park Courts",
    location: "San Francisco, CA",
    rating: 4.9,
    courts: 12,
    availability: "2 courts free",
    distance: "1.2 mi",
  },
  {
    name: "Marina Green Pickleball",
    location: "San Francisco, CA",
    rating: 4.7,
    courts: 4,
    availability: "Open Now",
    distance: "2.1 mi",
  },
];

const CourtFinder = () => {
  return (
    <section id="courts" className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-widest mb-4 block">Court Finder</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
              FIND YOUR
              <span className="text-gradient-accent block">PERFECT COURT</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg">
              Browse thousands of courts across the country. Check availability, read reviews, and book your spot in seconds.
            </p>

            {/* Search Box Mock */}
            <div className="bg-card rounded-xl p-4 border border-border mb-8">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-background rounded-lg">
                  <MapPin className="text-muted-foreground" size={20} />
                  <input 
                    type="text" 
                    placeholder="Enter your location..." 
                    className="bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-full"
                  />
                </div>
                <Button variant="hero" size="lg">
                  Search
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                15,000+ Courts
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Real-time Availability
              </span>
            </div>
          </div>

          {/* Right: Court Cards */}
          <div className="space-y-4">
            {courts.map((court, index) => (
              <div 
                key={court.name}
                className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all duration-300 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl text-foreground mb-1 group-hover:text-primary transition-colors">
                      {court.name}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin size={14} />
                      {court.location} • {court.distance}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/20 text-accent px-2 py-1 rounded-md text-sm font-semibold">
                    <Star size={14} fill="currentColor" />
                    {court.rating}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users size={14} />
                      {court.courts} courts
                    </span>
                    <span className="flex items-center gap-1 text-primary">
                      <Clock size={14} />
                      {court.availability}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourtFinder;
