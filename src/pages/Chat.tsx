import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, Loader2 } from "lucide-react";
import { useGroupContext } from "@/contexts/GroupContext";

const Chat = () => {
  const { currentGroup } = useGroupContext();
  const [groupmeUrl, setGroupmeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGroup?.id) return;
    supabase
      .from("groups")
      .select("groupme_url")
      .eq("id", currentGroup.id)
      .single()
      .then(({ data }) => {
        setGroupmeUrl((data as any)?.groupme_url ?? null);
        setLoading(false);
      });
  }, [currentGroup?.id]);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-8 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary" />
            Group Chat
          </h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : groupmeUrl ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 flex flex-col items-center gap-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {currentGroup?.name ?? "Group"} Chat
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    We use GroupMe for group messaging. Tap below to open the chat and stay connected with the crew!
                  </p>
                </div>
                <Button
                  size="lg"
                  className="gap-2"
                  asChild
                >
                  <a href={groupmeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-5 h-5" />
                    Open GroupMe Chat
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  No GroupMe chat has been set up for this group yet. Ask an admin to add the GroupMe link in Admin Settings.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
    </main>
  );
};

export default Chat;
