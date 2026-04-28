import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
};

const STATUSES = ["new", "in_progress", "resolved", "wont_fix", "duplicate"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  wont_fix: "bg-muted text-muted-foreground border-border",
  duplicate: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export function AdminFeedbackPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitterNames, setSubmitterNames] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feedback_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Feedback[];
    setItems(list);
    const init: Record<string, string> = {};
    list.forEach((f) => { init[f.id] = f.admin_notes ?? ""; });
    setNotes(init);

    // Fetch submitter display names
    const userIds = Array.from(new Set(list.map((f) => f.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, first_name, last_name")
        .in("user_id", userIds);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => {
        map[p.user_id] =
          p.display_name ||
          [p.first_name, p.last_name].filter(Boolean).join(" ") ||
          p.user_id.slice(0, 8);
      });
      setSubmitterNames(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setSavingId(id);
    const { error } = await supabase
      .from("feedback_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
      toast({ title: "Status updated" });
    }
  };

  const saveNotes = async (id: string) => {
    setSavingId(id);
    const { error } = await supabase
      .from("feedback_requests")
      .update({ admin_notes: notes[id] ?? "", updated_at: new Date().toISOString() })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      toast({ title: "Failed to save notes", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notes saved" });
    }
  };

  const visible = filter === "all" ? items : items.filter((f) => f.status === filter);
  const counts = items.reduce<Record<string, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="bg-card/50 border-border border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Feedback Inbox
          <Badge variant="secondary" className="ml-2">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({items.length})
          </Button>
          {STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
            >
              {s.replace("_", " ")} ({counts[s] ?? 0})
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No feedback in this category.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((f) => (
              <div key={f.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{f.type}</Badge>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[f.status] ?? ""}`}>
                        {f.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-foreground mt-2 break-words">{f.title}</h4>
                    {f.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                        {f.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      From <span className="text-foreground">{submitterNames[f.user_id] ?? f.user_id.slice(0, 8)}</span>{" "}
                      · {new Date(f.created_at).toLocaleString()}
                    </p>
                    {(f.screenshot_url || f.video_url) && (
                      <div className="flex gap-2 mt-2">
                        {f.screenshot_url && (
                          <a href={f.screenshot_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                            Screenshot <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {f.video_url && (
                          <a href={f.video_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                            Video <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <Select value={f.status} onValueChange={(v) => updateStatus(f.id, v)} disabled={savingId === f.id}>
                    <SelectTrigger className="w-36 h-8 text-xs shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Textarea
                    value={notes[f.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [f.id]: e.target.value }))}
                    placeholder="Admin notes (visible to admins only)..."
                    rows={2}
                    className="text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={() => saveNotes(f.id)} disabled={savingId === f.id}>
                    {savingId === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Notes"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
