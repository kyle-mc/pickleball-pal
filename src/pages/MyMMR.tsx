import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Video, User, ChevronRight, Trophy, Target, Gamepad2, Plus } from "lucide-react";
import { useGames } from "@/hooks/useGames";
import { useCurrentUserPlayer } from "@/hooks/useCurrentUserPlayer";
import { useEvents, useEventRsvps } from "@/hooks/useEvents";
import { useVideos } from "@/hooks/useVideos";
import { useRealtimeGames } from "@/hooks/useRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO, isAfter } from "date-fns";
import { RankProgressBar } from "@/components/RankProgressBar";
import { SeasonSelector } from "@/components/SeasonSelector";
import { getCurrentSeason } from "@/lib/seasons";
import GameEntryForm from "@/components/GameEntryForm";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AddVideoDialog } from "@/components/AddVideoDialog";

const MyMMR = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<number | "all">(currentSeason.id);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const { data: allGames = [], isLoading: gamesLoading } = useGames(selectedSeason);
  const { data: userPlayer, isLoading: playerLoading } = useCurrentUserPlayer();
  const { events, loading: eventsLoading } = useEvents();
  const { userRsvps, toggleRsvp, getRsvpCountForEvent } = useEventRsvps();
  const { data: videos = [] } = useVideos();
  
  useRealtimeGames();

  // Get player name from profile
  const playerName = userPlayer?.linkedPlayerName || userPlayer?.displayName;

  // Get player's games
  const playerGames = useMemo(() => {
    if (!playerName) return [];
    return allGames
      .filter(g => g.player === playerName)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.game - a.game;
      });
  }, [playerName, allGames]);

  // Calculate stats
  const stats = useMemo(() => {
    if (playerGames.length === 0) {
      return { currentMMR: 2000, winRate: 0, gamesPlayed: 0 };
    }
    
    const currentMMR = playerGames[0]?.mmrAfter || 2000;
    const wins = playerGames.filter(g => g.result === 'Winner').length;
    const winRate = Math.round((wins / playerGames.length) * 100);
    
    return {
      currentMMR,
      winRate,
      gamesPlayed: playerGames.length
    };
  }, [playerGames]);

  // Get upcoming events (future events user has RSVP'd to)
  const upcomingRsvpEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter(e => {
        const eventDate = parseISO(e.date);
        return isAfter(eventDate, today) && userRsvps.has(e.id);
      })
      .slice(0, 3);
  }, [events, userRsvps]);

  // Get upcoming events user hasn't RSVP'd to
  const availableEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter(e => {
        const eventDate = parseISO(e.date);
        return isAfter(eventDate, today) && !userRsvps.has(e.id);
      })
      .slice(0, 3);
  }, [events, userRsvps]);

  // Get videos featuring this player
  const playerVideos = useMemo(() => {
    if (!playerName) return [];
    return videos
      .filter(v => v.players?.includes(playerName))
      .slice(0, 3);
  }, [playerName, videos]);

  const isLoading = gamesLoading || playerLoading;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
        <MobileBottomNav />
      </main>
    );
  }

  // If no player linked, prompt to set up profile
  if (!playerName) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-24 md:pb-20">
          <div className="container mx-auto px-4 max-w-2xl">
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8">My MMR</h1>
            
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-medium text-foreground mb-2">Link Your Player Profile</h2>
                  <p className="text-muted-foreground mb-6">
                    To see your MMR and stats, you need to link your account to a player profile.
                  </p>
                  <Button asChild>
                    <Link to="/profile">
                      <User className="w-4 h-4 mr-2" />
                      Go to Profile Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header with player name */}
          <div className="flex items-center gap-4 mb-6">
            <PlayerAvatar name={playerName} avatarUrl={userPlayer?.avatarUrl} size="lg" />
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground">{playerName}</h1>
              <p className="text-muted-foreground">Your Pickleball Stats</p>
            </div>
          </div>

          {/* Rank visualization */}
          <Card className="bg-card/50 border-border mb-6">
            <CardContent className="pt-6 pb-8">
              <RankProgressBar mmr={stats.currentMMR} gamesPlayed={stats.gamesPlayed} />
            </CardContent>
          </Card>

          {/* Add Game and Add Video */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <GameEntryForm />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAddVideoOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <Video className="w-4 h-4" />
              Add Video
            </Button>
          </div>

          {/* Season selector and Stats */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Season Stats</h2>
            <SeasonSelector 
              selectedSeason={selectedSeason} 
              onSeasonChange={setSelectedSeason} 
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-3xl font-display text-foreground">{stats.currentMMR}</div>
                <div className="text-xs text-muted-foreground mt-1">MMR</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-3xl font-display text-foreground">{stats.winRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">Win Rate</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-3xl font-display text-foreground">{stats.gamesPlayed}</div>
                <div className="text-xs text-muted-foreground mt-1">Games</div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card className="bg-card/50 border-border mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-primary" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRsvpEvents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">You're signed up for:</p>
                  {upcomingRsvpEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20">
                      <div>
                        <div className="font-medium text-sm text-foreground">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(event.date), "EEE, MMM d")} • {event.time}
                        </div>
                      </div>
                      <span className="text-xs text-primary">✓ RSVP'd</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events you've RSVP'd to.</p>
              )}

              {availableEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Quick RSVP:</p>
                  <div className="space-y-2">
                    {availableEvents.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div>
                          <div className="font-medium text-sm text-foreground">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(event.date), "EEE, MMM d")} • {getRsvpCountForEvent(event.id)} going
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => toggleRsvp(event.id)}>
                          RSVP
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link to="/schedule" className="flex items-center gap-1 text-sm text-primary hover:underline mt-4">
                View all events <ChevronRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Profile reminder if not complete */}
              {!userPlayer?.profileComplete && (
                <Link 
                  to="/profile" 
                  className="flex items-center justify-between p-3 rounded bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-medium text-sm text-foreground">Complete Your Profile</div>
                      <div className="text-xs text-muted-foreground">Add more details to your player profile</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}

              {/* New videos featuring player */}
              {playerVideos.length > 0 && (
                <Link 
                  to={`/videos?player=${encodeURIComponent(playerName)}`}
                  className="flex items-center justify-between p-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-sm text-foreground">Your Videos</div>
                      <div className="text-xs text-muted-foreground">{playerVideos.length} video{playerVideos.length > 1 ? 's' : ''} featuring you</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}

              {/* Stats page link */}
              <Link 
                to="/standings" 
                className="flex items-center justify-between p-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-sm text-foreground">Leaderboard & Stats</div>
                    <div className="text-xs text-muted-foreground">Compare with other players</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              {/* Games page link */}
              <Link 
                to="/games" 
                className="flex items-center justify-between p-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-sm text-foreground">Match History</div>
                    <div className="text-xs text-muted-foreground">View all your games</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
      
      {/* Add Video Dialog */}
      <AddVideoDialog 
        open={isAddVideoOpen} 
        onOpenChange={setIsAddVideoOpen}
      />
    </main>
  );
};

export default MyMMR;
