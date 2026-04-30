import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FeedbackChat } from "@/components/FeedbackChat";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

type Feedback = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  screenshot_url: string | null;
  video_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  wont_fix: "bg-muted text-muted-foreground border-border",
  duplicate: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const MyFeedback = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("feedback_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data ?? []) as Feedback[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/profile">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <h1 className="font-display text-3xl sm:text-4xl text-foreground flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-primary" /> My Feedback
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="py-10 text-center text-muted-foreground">
                You haven't submitted any feedback yet. Use the user menu → Submit Feedback to send one.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((f) => {
                const open = !!openIds[f.id];
                return (
                  <Card key={f.id} className="bg-card/50 border-border">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{f.type}</Badge>
                            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[f.status] ?? ""}`}>
                              {f.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-2 break-words">{f.title}</CardTitle>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Submitted {new Date(f.created_at).toLocaleString()}
                            {f.updated_at !== f.created_at && ` · Updated ${new Date(f.updated_at).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {f.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {f.description}
                        </p>
                      )}
                      {(f.screenshot_url || f.video_url) && (
                        <div className="flex gap-3 text-xs">
                          {f.screenshot_url && (
                            <a href={f.screenshot_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
                              Screenshot <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {f.video_url && (
                            <a href={f.video_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
                              Video <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}

                      <Collapsible open={open} onOpenChange={(v) => setOpenIds((s) => ({ ...s, [f.id]: v }))}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            {open ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {open ? "Hide" : "Show"} chat with admin
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <FeedbackChat feedbackId={f.id} isAdmin={false} />
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
    </main>
  );
};

export default MyFeedback;
