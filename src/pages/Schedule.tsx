import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Users, Bell, Plus, Check, Repeat, Edit, CalendarDays, List, Filter, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEvents, useEventRsvps } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import CalendarView from "@/components/CalendarView";
import HostAssignmentSearch from "@/components/HostAssignmentSearch";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { addDays, addWeeks, addMonths, parseISO, format, isBefore, isAfter, startOfDay } from "date-fns";

const ITEMS_PER_PAGE = 6;

const Schedule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { events, loading, addEvent, updateEvent } = useEvents();
  const { userRsvps, toggleRsvp, getRsvpCountForEvent } = useEventRsvps();
  const { isSupported, permission, requestPermission, scheduleReminder } = usePushNotifications();
  
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [pastDisplayCount, setPastDisplayCount] = useState(ITEMS_PER_PAGE);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "open-play" as "open-play" | "tournament" | "practice" | "other",
    date: "",
    time: "",
    location: "",
    description: "",
    minPlayers: "4",
    maxPlayers: "",
    recurrenceType: "none" as "none" | "daily" | "weekly" | "biweekly" | "monthly" | "custom",
    customInterval: "1",
    hostIds: [] as string[],
  });

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');

  // Generate future occurrences for recurring events
  const generateRecurringInstances = (event: any): any[] => {
    if (!event.recurrence_type) return [];
    
    const baseDate = parseISO(event.date);
    const instances: any[] = [];
    let currentDate = baseDate;
    
    // Generate up to 10 future instances
    for (let i = 0; i < 10; i++) {
      switch (event.recurrence_type) {
        case 'daily':
          currentDate = addDays(baseDate, i + 1);
          break;
        case 'weekly':
          currentDate = addWeeks(baseDate, i + 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(baseDate, (i + 1) * 2);
          break;
        case 'monthly':
          currentDate = addMonths(baseDate, i + 1);
          break;
        case 'custom':
          const interval = event.recurrence_interval || 7;
          currentDate = addDays(baseDate, (i + 1) * interval);
          break;
        default:
          return instances;
      }
      
      const instanceDate = format(currentDate, 'yyyy-MM-dd');
      
      // Only include future dates
      if (instanceDate >= todayStr) {
        instances.push({
          ...event,
          date: instanceDate,
          isRecurringInstance: true,
          originalEventId: event.id,
          instanceKey: `${event.id}-${instanceDate}`,
        });
      }
    }
    
    return instances;
  };

  // Process events to handle recurring events properly
  const processedEvents = useMemo(() => {
    const allEvents: any[] = [];
    const seenDates = new Map<string, Set<string>>(); // eventId -> Set of dates shown
    
    events.forEach(event => {
      const eventDate = event.date;
      
      // Always include the original event
      allEvents.push(event);
      
      // For recurring events, generate future instances
      if (event.recurrence_type) {
        const instances = generateRecurringInstances(event);
        instances.forEach(instance => {
          // Avoid duplicates
          if (!seenDates.has(event.id)) {
            seenDates.set(event.id, new Set());
          }
          if (!seenDates.get(event.id)!.has(instance.date)) {
            seenDates.get(event.id)!.add(instance.date);
            allEvents.push(instance);
          }
        });
      }
    });
    
    return allEvents;
  }, [events, todayStr]);

  // Separate past and upcoming events
  const { filteredUpcoming, filteredPast } = useMemo(() => {
    // For upcoming, find the nearest future instance of each recurring event
    const upcomingMap = new Map<string, any>();
    const past: any[] = [];
    
    processedEvents.forEach(event => {
      const eventDate = event.date;
      const originalId = event.originalEventId || event.id;
      
      if (eventDate >= todayStr) {
        // For recurring events, keep only the nearest future instance
        if (event.recurrence_type || event.isRecurringInstance) {
          const existing = upcomingMap.get(originalId);
          if (!existing || eventDate < existing.date) {
            upcomingMap.set(originalId, event);
          }
        } else {
          // Non-recurring events - always show
          upcomingMap.set(event.id, event);
        }
      } else {
        // Past events - include all
        past.push(event);
      }
    });
    
    let upcoming = Array.from(upcomingMap.values());
    
    // Apply filters
    upcoming = upcoming
      .filter(e => filterType === "all" || e.type === filterType)
      .sort((a, b) => sortBy === "date" ? a.date.localeCompare(b.date) : a.title.localeCompare(b.title));
    
    const filteredPastEvents = past
      .filter(e => filterType === "all" || e.type === filterType)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    return { filteredUpcoming: upcoming, filteredPast: filteredPastEvents };
  }, [processedEvents, filterType, sortBy, todayStr]);

  // Infinite scroll for past events
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && pastDisplayCount < filteredPast.length) {
          setPastDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredPast.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [pastDisplayCount, filteredPast.length]);

  const displayedPastEvents = filteredPast.slice(0, pastDisplayCount);

  const canEditEvent = (event: any): boolean => {
    if (!user) return false;
    if (event.isRecurringInstance) return false; // Can't edit instances, only the original
    if (event.date < todayStr) return false; // Past events are locked
    if (!event.owner_id) return true; // No owner = anyone can edit
    if (event.owner_id === user.id) return true;
    if (event.host_ids?.includes(user.id)) return true;
    return false;
  };

  const handleRSVP = async (eventId: string) => {
    const wasRsvped = userRsvps.has(eventId);
    await toggleRsvp(eventId);
    toast({
      title: wasRsvped ? "RSVP Removed" : "RSVP Confirmed!",
      description: wasRsvped ? "You've removed your RSVP." : "You're signed up for this event.",
    });
  };

  const handleReminder = async (event: any) => {
    if (!isSupported) {
      toast({ 
        title: "Not Supported", 
        description: "Push notifications are not supported in this browser. Try Chrome or Firefox on desktop.", 
        variant: "destructive" 
      });
      return;
    }

    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        toast({ 
          title: "Permission Needed", 
          description: "To enable notifications: click the lock/info icon in your browser's address bar, find 'Notifications', and set it to 'Allow'. Then try again.", 
          variant: "destructive" 
        });
        return;
      }
    }

    const eventId = event.id;
    const isSet = reminders[eventId];
    
    if (!isSet) {
      scheduleReminder(eventId, event.title, event.date, event.time);
    }

    setReminders(prev => {
      const newReminders = { ...prev, [eventId]: !prev[eventId] };
      toast({
        title: newReminders[eventId] ? "Reminder Set!" : "Reminder Removed",
        description: newReminders[eventId] ? "You'll be notified 30 minutes before this event." : "Reminder has been removed.",
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
      description: newEvent.description || null,
      min_players: parseInt(newEvent.minPlayers) || 4,
      max_players: newEvent.maxPlayers ? parseInt(newEvent.maxPlayers) : null,
      recurrence_type: recurrenceType,
      recurrence_interval: recurrenceInterval,
      owner_id: user?.id || null,
      host_ids: [],
    });

    setIsCreateOpen(false);
    resetNewEvent();

    toast({
      title: "Event Created!",
      description: `${newEvent.title} has been added to the schedule.`,
    });
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    await updateEvent(editingEvent.id, {
      title: editingEvent.title,
      type: editingEvent.type,
      date: editingEvent.date,
      time: editingEvent.time,
      location: editingEvent.location,
      description: editingEvent.description,
      min_players: editingEvent.min_players,
      max_players: editingEvent.max_players,
      host_ids: editingEvent.host_ids || [],
    });

    setIsEditOpen(false);
    setEditingEvent(null);
    toast({ title: "Event Updated!" });
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: "",
      type: "open-play",
      date: "",
      time: "",
      location: "",
      description: "",
      minPlayers: "4",
      maxPlayers: "",
      recurrenceType: "none",
      customInterval: "1",
      hostIds: [],
    });
  };

  const openEditDialog = (event: any) => {
    // If it's a recurring instance, edit the original event
    const eventToEdit = event.isRecurringInstance 
      ? events.find(e => e.id === event.originalEventId) 
      : event;
    
    if (eventToEdit) {
      setEditingEvent({ ...eventToEdit });
      setIsEditOpen(true);
    }
  };

  const handlePastEventClick = (event: any) => {
    // Navigate to Games page filtered by event date
    navigate(`/games?date=${event.date}`);
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
    const count = getRsvpCountForEvent(eventId);
    return `${count}/${minPlayers || 4}`;
  };

  const isEventFull = (eventId: string, maxPlayers: number | null): boolean => {
    // 0 or null means no limit
    if (maxPlayers === null || maxPlayers === 0) return false;
    const count = getRsvpCountForEvent(eventId);
    return count >= maxPlayers;
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

  const renderEventCard = (event: any, isPast: boolean = false) => {
    const rsvpCount = getRsvpCountForEvent(event.id);
    const isFull = isEventFull(event.id, event.max_players);
    const canEdit = canEditEvent(event);

    return (
      <Card 
        key={event.instanceKey || event.id} 
        className={`bg-card/50 border-border ${isPast ? "opacity-75" : ""}`}
      >
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
              {isPast && <Lock className="w-3 h-3 text-muted-foreground" />}
            </div>
            <div className="flex items-center gap-1">
              {!isPast && canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); openEditDialog(event); }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit event"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {!isPast && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleReminder(event); }}
                  className={`p-1 rounded transition-colors ${reminders[event.id] ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
                  title={reminders[event.id] ? "Remove reminder" : "Set reminder"}
                >
                  <Bell className="w-4 h-4" fill={reminders[event.id] ? "currentColor" : "none"} />
                </button>
              )}
            </div>
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
            {event.description && (
              <p className="text-sm text-muted-foreground">{event.description}</p>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className={`font-medium ${
                rsvpCount >= (event.min_players || 4)
                  ? "text-primary" 
                  : "text-accent"
              }`}>
                {getRsvpRatio(event.id, event.min_players)}
              </span>
              <span className="text-muted-foreground text-sm">
                {event.max_players && event.max_players > 0 ? `(max ${event.max_players})` : "(no limit)"}
              </span>
            </div>
            {!isPast && (
              <Button 
                variant={userRsvps.has(event.id) ? "heroOutline" : "hero"}
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => { e.stopPropagation(); handleRSVP(event.id); }}
                disabled={isFull && !userRsvps.has(event.id)}
              >
                {userRsvps.has(event.id) ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    RSVP'd
                  </>
                ) : isFull ? (
                  "Event Full"
                ) : (
                  "Join"
                )}
              </Button>
            )}
            {isPast && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => handlePastEventClick(event)}
              >
                View Games from This Event
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-24 md:pb-20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
        <Footer />
        <MobileBottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground">Events</h1>
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </button>
              </div>
              
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
                      <GooglePlacesAutocomplete
                        value={newEvent.location}
                        onChange={(value) => setNewEvent(prev => ({ ...prev, location: value }))}
                        placeholder="Search for a location..."
                        className="bg-muted border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-muted-foreground">Description (optional)</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Event details..."
                        className="bg-muted border-border"
                      />
                    </div>
                    
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
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] bg-card border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="open-play">Open Play</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "title")}>
              <SelectTrigger className="w-[150px] bg-card border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="title">By Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {viewMode === "calendar" ? (
            <CalendarView 
              events={processedEvents.map(e => ({ id: e.id, title: e.title, date: e.date, time: e.time, type: e.type }))}
              onEventClick={(id) => {
                const event = events.find(e => e.id === id);
                if (event && event.date >= todayStr) {
                  openEditDialog(event);
                } else if (event) {
                  handlePastEventClick(event);
                }
              }}
            />
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="font-display text-2xl text-foreground mb-4">Upcoming Events</h2>
                {filteredUpcoming.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming events. Create one to get started!
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUpcoming.map((event) => renderEventCard(event, false))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="font-display text-2xl text-foreground mb-4">Past Events</h2>
                {displayedPastEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No past events yet.
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedPastEvents.map((event) => renderEventCard(event, true))}
                    </div>
                    
                    {pastDisplayCount < filteredPast.length && (
                      <div ref={loadMoreRef} className="py-4 text-center text-muted-foreground">
                        Loading more events...
                      </div>
                    )}
                    
                    {pastDisplayCount >= filteredPast.length && filteredPast.length > ITEMS_PER_PAGE && (
                      <div className="py-2 text-center text-muted-foreground text-sm">
                        Showing all {filteredPast.length} past events
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-muted-foreground">Event Title</Label>
                <Input 
                  value={editingEvent.title}
                  onChange={e => setEditingEvent((prev: any) => ({ ...prev, title: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Event Type</Label>
                <Select value={editingEvent.type} onValueChange={(v) => setEditingEvent((prev: any) => ({ ...prev, type: v }))}>
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
                  <Label className="text-muted-foreground">Date</Label>
                  <Input 
                    type="date"
                    value={editingEvent.date}
                    onChange={e => setEditingEvent((prev: any) => ({ ...prev, date: e.target.value }))}
                    className="bg-muted border-border"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Time</Label>
                  <Input 
                    type="time"
                    value={editingEvent.time}
                    onChange={e => setEditingEvent((prev: any) => ({ ...prev, time: e.target.value }))}
                    className="bg-muted border-border"
                  />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <GooglePlacesAutocomplete
                  value={editingEvent.location}
                  onChange={(value) => setEditingEvent((prev: any) => ({ ...prev, location: value }))}
                  placeholder="Search for a location..."
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <Textarea
                  value={editingEvent.description || ""}
                  onChange={e => setEditingEvent((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="bg-muted border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Min Players</Label>
                  <Input 
                    type="number"
                    value={editingEvent.min_players || ""}
                    onChange={e => setEditingEvent((prev: any) => ({ ...prev, min_players: parseInt(e.target.value) || 4 }))}
                    className="bg-muted border-border"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Max Players</Label>
                  <Input 
                    type="number"
                    value={editingEvent.max_players || ""}
                    onChange={e => setEditingEvent((prev: any) => ({ ...prev, max_players: e.target.value ? parseInt(e.target.value) : null }))}
                    className="bg-muted border-border"
                    placeholder="No limit"
                  />
                </div>
              </div>
              
              {/* Host Assignment */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Assign Co-Hosts</Label>
                <HostAssignmentSearch
                  currentHosts={editingEvent.host_ids || []}
                  onHostsChange={(hosts) => setEditingEvent((prev: any) => ({ ...prev, host_ids: hosts }))}
                />
              </div>

              <Button onClick={handleUpdateEvent} className="w-full" variant="hero">
                Update Event
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <MobileBottomNav />
    </main>
  );
};

export default Schedule;
