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
import { useEvents, useEventRsvps } from "@/hooks/useEvents";

const ITEMS_PER_PAGE = 6;

const Schedule = () => {
  const { toast } = useToast();
  const { events, loading, addEvent } = useEvents();
  const { userRsvps, toggleRsvp, getRsvpCountForEvent } = useEventRsvps();
  
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pastDisplayCount, setPastDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "open-play" as "open-play" | "tournament" | "practice" | "other",
    date: "",
    time: "",
    location: "",
    minPlayers: "4",
    maxPlayers: "",
    recurrenceType: "none" as "none" | "daily" | "weekly" | "biweekly" | "monthly" | "custom",
    customInterval: "1",
  });

  // Separate past and upcoming events based on date
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.date >= today);
  const pastEvents = events.filter(e => e.date < today);

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

  const handleRSVP = async (eventId: string) => {
    const wasRsvped = userRsvps.has(eventId);
    await toggleRsvp(eventId);
    toast({
      title: wasRsvped ? "RSVP Removed" : "RSVP Confirmed!",
      description: wasRsvped ? "You've removed your RSVP." : "You're signed up for this event.",
    });
  };

  const handleReminder = (eventId: string) => {
    setReminders(prev => {
      const newReminders = { ...prev, [eventId]: !prev[eventId] };
      toast({
        title: newReminders[eventId] ? "Reminder Set!" : "Reminder Removed",
        description: newReminders[eventId] ? "You'll be notified before this event." : "Reminder has been removed.",
      });
      return newReminders;
    });
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const recurrenceType = newEvent.recurrenceType !== "none" ? newEvent.recurrenceType : null;
    const recurrenceInterval = newEvent.recurrenceType === "custom" ? parseInt(newEvent.customInterval) || null : null;

    await addEvent({
      title: newEvent.title,
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      min_players: parseInt(newEvent.minPlayers) || 4,
      max_players: newEvent.maxPlayers ? parseInt(newEvent.maxPlayers) : null,
      recurrence_type: recurrenceType,
      recurrence_interval: recurrenceInterval,
    });

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
      description: `${newEvent.title} has been added to the schedule.`,
    });
  };

  const getRecurrenceLabel = (type: string | null, interval: number | null): string => {
    if (!type) return "";
    switch (type) {
      case "daily": return "daily";
      case "weekly": return "weekly";
      case "biweekly": return "every 2 weeks";
      case "monthly": return "monthly";
      default: return interval ? `every ${interval} days` : "custom";
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "open-play": return "Open Play";
      case "tournament": return "Tournament";
      case "practice": return "Practice";
      default: return "Event";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "tournament": return "bg-accent/20 text-accent";
      case "practice": return "bg-blue-500/20 text-blue-500";
      default: return "bg-primary/20 text-primary";
    }
  };

  const getRsvpRatio = (eventId: string, minPlayers: number | null): string => {
    const rsvpCount = getRsvpCountForEvent(eventId) + (userRsvps.has(eventId) ? 0 : 0);
    return `${getRsvpCountForEvent(eventId)}/${minPlayers || 4}`;
  };

  const isEventFull = (eventId: string, maxPlayers: number | null): boolean => {
    if (maxPlayers === null) return false;
    return getRsvpCountForEvent(eventId) >= maxPlayers;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
        <Footer />
      </main>
    );
  }

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
                    <Select value={newEvent.type} onValueChange={(v: typeof newEvent.type) => setNewEvent(prev => ({ ...prev, type: v }))}>
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
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming events. Create one to get started!
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="bg-card/50 border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                              {getEventTypeLabel(event.type)}
                            </span>
                            {event.recurrence_type && (
                              <span className="text-muted-foreground" title={`Repeats ${getRecurrenceLabel(event.recurrence_type, event.recurrence_interval)}`}>
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
                          <span className="font-medium">{formatDate(event.date)}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{formatTime(event.time)}</span>
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
                              getRsvpCountForEvent(event.id) >= (event.min_players || 4)
                                ? "text-primary" 
                                : "text-accent"
                            }`}>
                              {getRsvpRatio(event.id, event.min_players)}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {event.max_players ? `(max ${event.max_players})` : "(no limit)"}
                            </span>
                          </div>
                          <Button 
                            variant={userRsvps.has(event.id) ? "heroOutline" : "hero"}
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => handleRSVP(event.id)}
                            disabled={isEventFull(event.id, event.max_players) && !userRsvps.has(event.id)}
                          >
                            {userRsvps.has(event.id) ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                RSVP'd
                              </>
                            ) : isEventFull(event.id, event.max_players) ? (
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
              )}
            </section>
            
            {pastEvents.length > 0 && (
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
                              <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                          <span className="text-foreground">{event.title}</span>
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
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Schedule;
