import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Comment {
  id: string;
  video_id: string;
  user_id: string | null;
  session_id: string | null;
  content: string;
  created_at: string;
  display_name?: string | null;
}

interface VideoCommentsProps {
  videoId: string;
}

// Generate or get session ID for anonymous comments
const getSessionId = () => {
  let sessionId = localStorage.getItem('pickle_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('pickle_session_id', sessionId);
  }
  return sessionId;
};

export function VideoComments({ videoId }: VideoCommentsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionId = getSessionId();

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('video_comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setIsLoading(false);
      return;
    }

    // Fetch display names for user_ids
    const userIds = [...new Set((data || []).filter(c => c.user_id).map(c => c.user_id!))];
    let profileMap: Record<string, string> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      
      if (profiles) {
        profiles.forEach(p => {
          if (p.display_name) profileMap[p.user_id] = p.display_name;
        });
      }
    }

    setComments((data || []).map(c => ({
      ...c,
      display_name: c.user_id ? (profileMap[c.user_id] || "User") : null,
    })));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`video-comments-${videoId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'video_comments',
          filter: `video_id=eq.${videoId}`
        },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    
    const { error } = await supabase.from('video_comments').insert({
      video_id: videoId,
      user_id: user?.id || null,
      session_id: user ? null : sessionId,
      content: newComment.trim(),
    });

    if (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      toast({ title: "Comment added!" });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{comments.length} Comments</span>
      </div>

      {/* Comment input */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="bg-muted border-border min-h-[60px] resize-none"
        />
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !newComment.trim()}
          size="icon"
          className="shrink-0"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-foreground">
                  {comment.display_name || "Guest"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-sm text-foreground">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
