import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Upload, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePlayers } from "@/hooks/usePlayers";
import GameEntryForm, { type GameEntryPrefill } from "@/components/GameEntryForm";

type Status = "idle" | "recording" | "processing" | "ready";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const result = r.result as string;
      const i = result.indexOf("base64,");
      resolve(i >= 0 ? result.slice(i + 7) : result);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function VoiceMemoGameDialog() {
  const { toast } = useToast();
  const { data: players = [] } = usePlayers();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [prefill, setPrefill] = useState<GameEntryPrefill | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setStatus("idle");
    setTranscript("");
    setPrefill(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await processAudio(blob);
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setStatus("recording");
    } catch (e) {
      console.error(e);
      toast({
        title: "Microphone unavailable",
        description: "Please grant microphone access or upload a file instead.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 20MB.", variant: "destructive" });
      return;
    }
    await processAudio(file);
  };

  const processAudio = async (blob: Blob) => {
    setStatus("processing");
    try {
      const audio = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke("transcribe-game-memo", {
        body: { audio, mimeType: blob.type || "audio/webm", knownPlayers: players },
      });
      if (error) throw error;
      const t = data?.transcript ?? "";
      setTranscript(t);
      const p = data?.parsed;
      if (p && Array.isArray(p.winners) && Array.isArray(p.losers)) {
        const draft: GameEntryPrefill = {
          gameMode: p.gameMode === "singles" ? "singles" : "doubles",
          winningPlayers: p.winners,
          losingPlayers: p.losers,
          winningScore: String(p.winningScore ?? 11),
          losingScore: String(p.losingScore ?? 0),
        };
        setPrefill(draft);
        setStatus("ready");
        // Open the standard entry form prefilled — close this dialog to avoid stacking.
        setOpen(false);
        setReviewOpen(true);
      } else {
        setStatus("ready");
        toast({
          title: "Couldn't auto-fill",
          description: "I transcribed the memo but couldn't extract players & score. You can copy it into the form manually.",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Transcription failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      setStatus("idle");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-9 gap-2 px-3">
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Voice</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" /> Add Game by Voice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tap record and say something like{" "}
              <span className="text-foreground italic">"Chris and Braden beat Kyle and Stephen eleven to seven."</span>
            </p>

            {status !== "recording" ? (
              <Button
                variant="hero"
                className="w-full gap-2"
                onClick={startRecording}
                disabled={status === "processing"}
              >
                {status === "processing"
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Transcribing…</>
                  : <><Mic className="w-4 h-4" />Start recording</>}
              </Button>
            ) : (
              <Button variant="destructive" className="w-full gap-2" onClick={stopRecording}>
                <Square className="w-4 h-4 fill-current" />
                Stop &amp; transcribe
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.currentTarget.value = "";
              }}
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === "processing" || status === "recording"}
            >
              <Upload className="w-4 h-4" /> Upload an audio file
            </Button>

            {transcript && (
              <div className="text-xs text-muted-foreground p-3 bg-muted/40 border border-border rounded">
                <span className="block font-medium text-foreground mb-1">Transcript</span>
                {transcript}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Standard entry form prefilled with parsed result for review/edit. */}
      <GameEntryForm
        hideTrigger
        open={reviewOpen}
        onOpenChange={(o) => {
          setReviewOpen(o);
          if (!o) {
            setPrefill(null);
            setTranscript("");
          }
        }}
        prefill={prefill}
        defaultGameMode={prefill?.gameMode || "doubles"}
      />
    </>
  );
}
