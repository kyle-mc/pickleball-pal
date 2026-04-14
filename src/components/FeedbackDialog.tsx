import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus, Loader2, Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function FeedbackDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("bug");
  const [submitting, setSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Video must be under 50MB", variant: "destructive" });
      return;
    }
    setVideoFile(file);
  };

  const handleSubmit = async () => {
    if (!user || !title.trim()) {
      toast({ title: "Required", description: "Please enter a title.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = null;
      let videoUrl = null;

      if (screenshotFile) {
        const ext = screenshotFile.name.split('.').pop();
        const path = `${user.id}/feedback-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('avatars').upload(path, screenshotFile);
        if (!error) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          screenshotUrl = urlData.publicUrl;
        }
      }

      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `${user.id}/feedback-video-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('videos').upload(path, videoFile);
        if (!error) {
          const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
          videoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('feedback_requests').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        screenshot_url: screenshotUrl,
        video_url: videoUrl,
      } as any);

      if (error) throw error;

      toast({ title: "Feedback submitted!", description: "Thank you for your feedback." });
      setOpen(false);
      setTitle("");
      setDescription("");
      setType("bug");
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setVideoFile(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit feedback.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground w-full">
          <MessageSquarePlus className="w-4 h-4" />
          Submit Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            Submit Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">🐛 Bug Report</SelectItem>
                <SelectItem value="feature">💡 Feature Request</SelectItem>
                <SelectItem value="other">📝 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief description of the issue or request" />
          </div>

          <div>
            <Label className="text-sm">Details</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue or feature in detail..." rows={4} />
          </div>

          <div>
            <Label className="text-sm">Screenshot</Label>
            <div className="mt-1">
              {screenshotPreview ? (
                <div className="relative">
                  <img src={screenshotPreview} alt="Screenshot" className="rounded-lg border border-border max-h-40 object-contain w-full" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80"
                    onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add screenshot</span>
                  <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm">Screen Recording (max 50MB, 30s)</Label>
            <div className="mt-1">
              {videoFile ? (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border">
                  <span className="text-sm text-foreground truncate flex-1">{videoFile.name}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setVideoFile(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload video</span>
                  <input type="file" accept="video/*" onChange={handleVideo} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full" variant="hero">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
