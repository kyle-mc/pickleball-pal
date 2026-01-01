import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, Bell, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: number;
  title: string;
  type: "open-play" | "tournament" | "practice" | "other";
  date: string;
  time: string;
  location: string;
  players: string[];
  maxPlayers: number;
  description?: string;
  reminder?: boolean;
}

const Schedule = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([
    { id: 1, title: "Weekly Open Play", type: "open-play", date: "Jan 5", time: "6:00 PM", location: "Central Park Courts", players: ["Kyle", "Chris", "Brandon", "Josiah", "Braden", "Corbin"], maxPlayers: 8 },
    { id: 2, title: "Morning Session", type: "open-play", date: "Jan 7", time: "10:00 AM", location: "Riverside Recreation", players: ["Kyle", "Josiah", "Brandon", "Chris"], maxPlayers: 8 },
    { id: 3, title: "Winter Tournament", type: "tournament", date: "Jan 8", time: "7:00 PM", location: "Downtown Athletic Club", players: ["Kyle", "Chris", "Brandon", "Josiah", "Braden", "Corbin", "Hayden", "Maxx"], maxPlayers: 8 },
  ]);
  
  const [rsvps, setRsvps] = useState<Record<number, boolean>>({});
  const [reminders, setReminders] = useState<Record<number, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    type: Event["type"];
    date: string;
    time: string;
    location: string;
    maxPlayers: string;
  }>({
    title: "",
    type: "open-play",
    date: "",
    time: "",
    location: "",
    maxPlayers: "8",
  });

  const pastSessions = [
    { id: 4, date: "Jan 2", time: "6:00 PM", location: "Central Park Courts", gamesPlayed: 6 },
    { id: 5, date: "Dec 30", time: "10:00 AM", location: "Riverside Recreation", gamesPlayed: 8 },
  ];

  const handleRSVP = (eventId: number) => {
    setRsvps(prev => {
      const newRsvps = { ...prev, [eventId]: !prev[eventId] };
      toast({
        title: newRsvps[eventId] ? "RSVP Confirmed!" : "RSVP Removed",
        description: newRsvps[eventId] ? "You're signed up for this event." : "You've removed your RSVP.",
      });
      return newRsvps;
    });
  };

  const handleReminder = (eventId: number) => {
    setReminders(prev => {
      const newReminders = { ...prev, [eventId]: !prev[eventId] };
      toast({
        title: newReminders[eventId] ? "Reminder Set!" : "Reminder Removed",
        description: newReminders[eventId] ? "You'll be notified before this event." : "Reminder has been removed.",
      });
      return newReminders;
    });
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const event: Event = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      players: [],
      maxPlayers: parseInt(newEvent.maxPlayers),
    };

    setEvents(prev => [...prev, event]);
    setIsCreateOpen(false);
    setNewEvent({
      title: "",
      type: "open-play",
      date: "",
      time: "",
      location: "",
      maxPlayers: "8",
    });

    toast({
      title: "Event Created!",
      description: `${event.title} has been added to the schedule.`,
    });
  };

  const getEventTypeLabel = (type: Event["type"]) => {
    switch (type) {
      case "open-play": return "Open Play";
      case "tournament": return "Tournament";
      case "practice": return "Practice";
      default: return "Event";
    }
  };

  const getEventTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "tournament": return "bg-accent/20 text-accent";
      case "practice": return "bg-blue-500/20 text-blue-500";
      default: return "bg-primary/20 text-primary";
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground">Schedule</h1>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="title" className="text-muted-foreground">Event Title</Label>
                    <Input 
                      id="title"
                      value={newEvent.title}
                      onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Weekly Open Play"
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(v: Event["type"]) => setNewEvent(prev => ({ ...prev, type: v }))}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="open-play">Open Play</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date" className="text-muted-foreground">Date</Label>
                      <Input 
                        id="date"
                        value={newEvent.date}
                        onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                        placeholder="Jan 10"
                        className="bg-muted border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-muted-foreground">Time</Label>
                      <Input 
                        id="time"
                        value={newEvent.time}
                        onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                        placeholder="6:00 PM"
                        className="bg-muted border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-muted-foreground">Location</Label>
                    <Input 
                      id="location"
                      value={newEvent.location}
                      onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Central Park Courts"
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPlayers" className="text-muted-foreground">Max Players</Label>
                    <Input 
                      id="maxPlayers"
                      type="number"
                      value={newEvent.maxPlayers}
                      onChange={e => setNewEvent(prev => ({ ...prev, maxPlayers: e.target.value }))}
                      className="bg-muted border-border"
                    />
                  </div>
                  <Button onClick={handleCreateEvent} className="w-full" variant="hero">
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="font-display text-2xl text-foreground mb-4">Upcoming Events</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <Card key={event.id} className="bg-card/50 border-border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </span>
                        <button
                          onClick={() => handleReminder(event.id)}
                          className={`p-1 rounded transition-colors ${reminders[event.id] ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
                          title={reminders[event.id] ? "Remove reminder" : "Set reminder"}
                        >
                          <Bell className="w-4 h-4" fill={reminders[event.id] ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <CardTitle className="text-foreground text-lg mt-2">{event.title}</CardTitle>
                      <div className="flex items-center gap-2 text-primary">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{event.date}</span>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{event.time}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{event.players.length}/{event.maxPlayers} players</span>
                        </div>
                        {event.players.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {event.players.slice(0, 4).join(", ")}
                            {event.players.length > 4 && ` +${event.players.length - 4} more`}
                          </div>
                        )}
                        <Button 
                          variant={rsvps[event.id] ? "heroOutline" : "hero"}
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => handleRSVP(event.id)}
                          disabled={event.players.length >= event.maxPlayers && !rsvps[event.id]}
                        >
                          {rsvps[event.id] ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              RSVP'd
                            </>
                          ) : event.players.length >= event.maxPlayers ? (
                            "Full"
                          ) : (
                            "RSVP"
                          )}
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

export default Schedule;
