import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const Sessions = () => {
  const upcomingSessions = [
    { id: 1, date: "Jan 5", time: "6:00 PM", location: "Central Park Courts", players: 6, maxPlayers: 8 },
    { id: 2, date: "Jan 7", time: "10:00 AM", location: "Riverside Recreation", players: 4, maxPlayers: 8 },
    { id: 3, date: "Jan 8", time: "7:00 PM", location: "Downtown Athletic Club", players: 8, maxPlayers: 8 },
  ];

  const pastSessions = [
    { id: 4, date: "Jan 2", time: "6:00 PM", location: "Central Park Courts", gamesPlayed: 6 },
    { id: 5, date: "Dec 30", time: "10:00 AM", location: "Riverside Recreation", gamesPlayed: 8 },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground">Sessions</h1>
            <Button variant="hero">Create Session</Button>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="font-display text-2xl text-foreground mb-4">Upcoming</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => (
                  <Card key={session.id} className="bg-card/50 border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{session.date}</span>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{session.time}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{session.players}/{session.maxPlayers} players</span>
                        </div>
                        <Button 
                          variant={session.players >= session.maxPlayers ? "heroOutline" : "hero"} 
                          size="sm" 
                          className="w-full mt-2"
                          disabled={session.players >= session.maxPlayers}
                        >
                          {session.players >= session.maxPlayers ? "Full" : "Join Session"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="font-display text-2xl text-foreground mb-4">Past Sessions</h2>
              <div className="space-y-3">
                {pastSessions.map((session) => (
                  <Card key={session.id} className="bg-card/50 border-border">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{session.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{session.location}</span>
                          </div>
                        </div>
                        <span className="text-foreground">{session.gamesPlayed} games played</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Sessions;
