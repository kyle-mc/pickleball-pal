import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, Calendar, Video, Gamepad2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const NAV_ITEMS = [
  { path: "/", label: "My MMR", icon: Home },
  { path: "/standings", label: "Stats", icon: Trophy },
  { path: "/schedule", label: "Schedule", icon: Calendar },
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/games", label: "Games", icon: Gamepad2 },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
