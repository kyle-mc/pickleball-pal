import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, User } from "lucide-react";
import { ImageCropDialog } from "@/components/ImageCropDialog";

interface AvatarUploadProps {
  avatarUrl: string | null;
  displayName: string | null;
  onUploadComplete: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

export const AvatarUpload = ({
  avatarUrl,
  displayName,
  onUploadComplete,
  size = "lg",
}: AvatarUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 10MB.", variant: "destructive" });
      return;
    }

    // Read file as data URL and open crop dialog
    const reader = new FileReader();
    reader.onload = () => setCropSrc(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      onUploadComplete(publicUrl);
      toast({ title: "Avatar updated!", description: "Your profile picture has been updated." });
      setCropSrc(null);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl || undefined} alt={displayName || "Avatar"} />
        <AvatarFallback className="bg-primary/20 text-primary">
          {initials || <User className="w-1/2 h-1/2" />}
        </AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full shadow-md"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
      </Button>

      <ImageCropDialog
        open={!!cropSrc}
        onOpenChange={(o) => { if (!o) setCropSrc(null); }}
        imageSrc={cropSrc}
        aspect={1}
        outputSize={512}
        onCropComplete={handleCroppedUpload}
        title="Crop Profile Picture"
        saving={uploading}
      />
    </div>
  );
};
