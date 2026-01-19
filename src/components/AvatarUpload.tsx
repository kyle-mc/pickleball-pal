import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, User } from "lucide-react";

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
  size = "lg" 
}: AvatarUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || "?";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onUploadComplete(publicUrl);
      
      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated.",
      });
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};
