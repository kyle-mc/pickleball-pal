import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, Calendar, Video, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Custom pickleball icon component - designed to look like an actual pickleball
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
    <circle cx="7" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="6" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="10" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="7" cy="16" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="16" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const NAV_ITEMS = [
  { path: "/", label: "My MMR", tourLabel: "mymmr", icon: Home },
  { path: "/standings", label: "Stats", tourLabel: "stats", icon: Trophy },
  { path: "/games", label: "Games", tourLabel: "games", icon: "pickleball" as const },
  { path: "/videos", label: "Videos", tourLabel: "videos", icon: Video },
  { path: "/schedule", label: "Events", tourLabel: "events", icon: Calendar },
  { path: "/chat", label: "Chat", tourLabel: "chat", icon: MessageCircle },
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
              data-tour={`mobile-nav-${item.tourLabel}`}
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
