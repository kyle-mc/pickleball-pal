import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, Calendar, Video, CircleDot } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Custom pickleball icon component
const PickleballIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="8" cy="9" r="1.5" fill="currentColor" />
    <circle cx="16" cy="9" r="1.5" fill="currentColor" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    <circle cx="8" cy="15" r="1.5" fill="currentColor" />
    <circle cx="16" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

const NAV_ITEMS = [
  { path: "/", label: "My MMR", icon: Home },
  { path: "/standings", label: "Stats", icon: Trophy },
  { path: "/games", label: "Games", icon: "pickleball" as const },
  { path: "/videos", label: "Videos", icon: Video },
  { path: "/schedule", label: "Events", icon: Calendar },
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
              {item.icon === "pickleball" ? (
                <PickleballIcon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              ) : (
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              )}
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