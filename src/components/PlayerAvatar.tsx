import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export const PlayerAvatar = ({ 
  name, 
  avatarUrl, 
  size = "sm",
  className = ""
}: PlayerAvatarProps) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={avatarUrl || undefined} alt={name} />
      <AvatarFallback className="bg-primary/20 text-primary">
        {initials || <User className="w-1/2 h-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
};
