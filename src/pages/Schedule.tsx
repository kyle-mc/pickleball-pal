import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, Bell, Plus, Check, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: number;
  title: string;
  type: "open-play" | "tournament" | "practice" | "other";
  date: string;
  time: string;
  location: string;
  players: string[];
  minPlayers: number;
  maxPlayers: number | null;
  description?: string;
  reminder?: boolean;
  recurrence?: RecurrenceRule | null;
}

interface RecurrenceRule {
  type: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  interval?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: string;
}

const ITEMS_PER_PAGE = 6;

const Schedule = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([
    { id: 1, title: "Weekly Open Play", type: "open-play", date: "Jan 5", time: "6:00 PM", location: "Central Park Courts", players: ["Kyle", "Chris", "Brandon", "Josiah", "Braden", "Corbin"], minPlayers: 4, maxPlayers: 8, recurrence: { type: "weekly", daysOfWeek: [0] } },
    { id: 2, title: "Morning Session", type: "open-play", date: "Jan 7", time: "10:00 AM", location: "Riverside Recreation", players: ["Kyle", "Josiah", "Brandon", "Chris"], minPlayers: 4, maxPlayers: 8 },
    { id: 3, title: "Winter Tournament", type: "tournament", date: "Jan 8", time: "7:00 PM", location: "Downtown Athletic Club", players: ["Kyle", "Chris", "Brandon", "Josiah", "Braden", "Corbin", "Hayden", "Maxx"], minPlayers: 8, maxPlayers: 16 },
    { id: 4, title: "Casual Practice", type: "practice", date: "Jan 10", time: "5:00 PM", location: "Community Center", players: ["Kyle", "Chris"], minPlayers: 2, maxPlayers: 4 },
    { id: 5, title: "Friday Night Lights", type: "open-play", date: "Jan 12", time: "8:00 PM", location: "Central Park Courts", players: ["Brandon", "Josiah"], minPlayers: 4, maxPlayers: null, recurrence: { type: "weekly", daysOfWeek: [5] } },
  ]);
  
  const [pastEvents] = useState([
    { id: 100, date: "Jan 2", time: "6:00 PM", location: "Central Park Courts", gamesPlayed: 6, type: "open-play" as const },
    { id: 101, date: "Dec 30", time: "10:00 AM", location: "Riverside Recreation", gamesPlayed: 8, type: "open-play" as const },
    { id: 102, date: "Dec 28", time: "7:00 PM", location: "Downtown Athletic Club", gamesPlayed: 12, type: "tournament" as const },
    { id: 103, date: "Dec 23", time: "6:00 PM", location: "Central Park Courts", gamesPlayed: 5, type: "open-play" as const },
    { id: 104, date: "Dec 21", time: "10:00 AM", location: "Community Center", gamesPlayed: 4, type: "practice" as const },
    { id: 105, date: "Dec 16", time: "6:00 PM", location: "Central Park Courts", gamesPlayed: 7, type: "open-play" as const },
    { id: 106, date: "Dec 14", time: "8:00 PM", location: "Central Park Courts", gamesPlayed: 6, type: "open-play" as const },
    { id: 107, date: "Dec 9", time: "6:00 PM", location: "Riverside Recreation", gamesPlayed: 9, type: "open-play" as const },
  ]);
  
  const [rsvps, setRsvps] = useState<Record<number, boolean>>({});
  const [reminders, setReminders] = useState<Record<number, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pastDisplayCount, setPastDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [newEvent, setNewEvent] = useState<{
    title: string;
    type: Event["type"];
    date: string;
    time: string;
    location: string;
    minPlayers: string;
    maxPlayers: string;
    recurrenceType: "none" | "daily" | "weekly" | "biweekly" | "monthly" | "custom";
    customInterval: string;
  }>({
    title: "",
    type: "open-play",
    date: "",
    time: "",
    location: "",
    minPlayers: "4",
    maxPlayers: "",
    recurrenceType: "none",
    customInterval: "1",
  });

  // Infinite scroll for past events
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && pastDisplayCount < pastEvents.length) {
          setPastDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, pastEvents.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [pastDisplayCount, pastEvents.length]);

  const displayedPastEvents = pastEvents.slice(0, pastDisplayCount);

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

    let recurrence: RecurrenceRule | null = null;
    if (newEvent.recurrenceType !== "none") {
      recurrence = { type: newEvent.recurrenceType === "custom" ? "weekly" : newEvent.recurrenceType };
      if (newEvent.recurrenceType === "custom") {
        recurrence.interval = parseInt(newEvent.customInterval) || 1;
      }
    }

    const event: Event = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      players: [],
      minPlayers: parseInt(newEvent.minPlayers) || 4,
      maxPlayers: newEvent.maxPlayers ? parseInt(newEvent.maxPlayers) : null,
      recurrence,
    };

    setEvents(prev => [...prev, event]);
    setIsCreateOpen(false);
    setNewEvent({
      title: "",
      type: "open-play",
      date: "",
      time: "",
      location: "",
      minPlayers: "4",
      maxPlayers: "",
      recurrenceType: "none",
      customInterval: "1",
    });

    toast({
      title: "Event Created!",
      description: `${event.title} has been added to the schedule.${recurrence ? " It will repeat " + getRecurrenceLabel(recurrence) + "." : ""}`,
    });
  };

  const getRecurrenceLabel = (recurrence: RecurrenceRule): string => {
    switch (recurrence.type) {
      case "daily": return "daily";
      case "weekly": return "weekly";
      case "biweekly": return "every 2 weeks";
      case "monthly": return "monthly";
      default: return recurrence.interval ? `every ${recurrence.interval} days` : "custom";
    }
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

  const getRsvpRatio = (event: Event): string => {
    const rsvpCount = event.players.length + (rsvps[event.id] ? 1 : 0);
    return `${rsvpCount}/${event.minPlayers}`;
  };

  const isEventFull = (event: Event): boolean => {
    if (event.maxPlayers === null) return false;
    const rsvpCount = event.players.length + (rsvps[event.id] ? 1 : 0);
    return rsvpCount >= event.maxPlayers;
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
              <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
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
                        type="date"
                        value={newEvent.date}
                        onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                        className="bg-muted border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time" className="text-muted-foreground">Time</Label>
                      <Input 
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
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
                  
                  {/* Player Capacity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minPlayers" className="text-muted-foreground">Minimum Players</Label>
                      <Input 
                        id="minPlayers"
                        type="number"
                        value={newEvent.minPlayers}
                        onChange={e => setNewEvent(prev => ({ ...prev, minPlayers: e.target.value }))}
                        placeholder="4"
                        className="bg-muted border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxPlayers" className="text-muted-foreground">Maximum Players (optional)</Label>
                      <Input 
                        id="maxPlayers"
                        type="number"
                        value={newEvent.maxPlayers}
                        onChange={e => setNewEvent(prev => ({ ...prev, maxPlayers: e.target.value }))}
                        placeholder="No limit"
                        className="bg-muted border-border"
                      />
                    </div>
                  </div>

                  {/* Recurrence */}
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Repeat className="w-4 h-4" />
                      Repeat
                    </Label>
                    <Select 
                      value={newEvent.recurrenceType} 
                      onValueChange={(v: typeof newEvent.recurrenceType) => setNewEvent(prev => ({ ...prev, recurrenceType: v }))}
                    >
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newEvent.recurrenceType === "custom" && (
                    <div>
                      <Label htmlFor="customInterval" className="text-muted-foreground">Repeat every X days</Label>
                      <Input 
                        id="customInterval"
                        type="number"
                        value={newEvent.customInterval}
                        onChange={e => setNewEvent(prev => ({ ...prev, customInterval: e.target.value }))}
                        placeholder="7"
                        className="bg-muted border-border"
                      />
                    </div>
                  )}

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
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {getEventTypeLabel(event.type)}
                          </span>
                          {event.recurrence && (
                            <span className="text-muted-foreground" title={`Repeats ${getRecurrenceLabel(event.recurrence)}`}>
                              <Repeat className="w-3 h-3" />
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className={`font-medium ${
                            event.players.length + (rsvps[event.id] ? 1 : 0) >= event.minPlayers 
                              ? "text-primary" 
                              : "text-accent"
                          }`}>
                            {getRsvpRatio(event)}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {event.maxPlayers ? `(max ${event.maxPlayers})` : "(no limit)"}
                          </span>
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
                          disabled={isEventFull(event) && !rsvps[event.id]}
                        >
                          {rsvps[event.id] ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              RSVP'd
                            </>
                          ) : isEventFull(event) ? (
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
              <h2 className="font-display text-2xl text-foreground mb-4">Past Events</h2>
              <div className="space-y-3">
                {displayedPastEvents.map((event) => (
                  <Card key={event.id} className="bg-card/50 border-border">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                            {getEventTypeLabel(event.type)}
                          </span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <span className="text-foreground">{event.gamesPlayed} games played</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {pastDisplayCount < pastEvents.length && (
                  <div ref={loadMoreRef} className="py-4 text-center text-muted-foreground">
                    Loading more events...
                  </div>
                )}
                
                {pastDisplayCount >= pastEvents.length && pastEvents.length > ITEMS_PER_PAGE && (
                  <div className="py-2 text-center text-muted-foreground text-sm">
                    Showing all {pastEvents.length} past events
                  </div>
                )}
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
