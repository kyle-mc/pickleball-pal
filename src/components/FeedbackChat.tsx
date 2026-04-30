import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  user_id: string;
  is_admin: boolean;
  content: string;
  created_at: string;
}

interface Props {
  feedbackId: string;
  isAdmin: boolean;
  /** Map user_id -> display name (optional, for prettier sender labels) */
  senderNames?: Record<string, string>;
  /** Hard cap matched to DB policy */
  maxMessages?: number;
}

export function FeedbackChat({ feedbackId, isAdmin, senderNames = {}, maxMessages = 200 }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feedback_chat_messages")
      .select("*")
      .eq("feedback_id", feedbackId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [feedbackId]);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel(`feedback-chat-${feedbackId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_chat_messages", filter: `feedback_id=eq.${feedbackId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [feedbackId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    if (!user || !draft.trim()) return;
    if (messages.length >= maxMessages) {
      toast({ title: "Chat limit reached", description: `Max ${maxMessages} messages per feedback.`, variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback_chat_messages").insert({
      feedback_id: feedbackId,
      user_id: user.id,
      is_admin: isAdmin,
      content: draft.trim(),
    });
    setSending(false);
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      setDraft("");
    }
  };

  const removeMessage = async (id: string) => {
    const { error } = await supabase.from("feedback_chat_messages").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={scrollRef}
        className="max-h-64 overflow-y-auto rounded-md border border-border bg-background/40 p-2 space-y-2"
      >
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === user?.id;
            const label = m.is_admin ? "Admin" : (senderNames[m.user_id] || "User");
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${mine ? "bg-primary/20 border border-primary/30" : "bg-muted/50 border border-border"}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-medium ${m.is_admin ? "text-primary" : "text-foreground"}`}>{label}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                    {mine && (
                      <button onClick={() => removeMessage(m.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-foreground">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // stop parent menu/dropdown intercepts
            e.stopPropagation();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={messages.length >= maxMessages ? "Message limit reached" : "Type a message…"}
          rows={2}
          disabled={messages.length >= maxMessages}
          className="text-xs resize-none"
        />
        <Button size="sm" onClick={send} disabled={sending || !draft.trim() || messages.length >= maxMessages}>
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground text-right">
        {messages.length}/{maxMessages} messages
      </p>
    </div>
  );
}
