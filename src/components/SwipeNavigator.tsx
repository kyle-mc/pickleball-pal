import { useState, useRef, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface SwipeNavigatorProps {
  children: ReactNode;
}

const PAGES = [
  { path: "/", label: "My MMR" },
  { path: "/standings", label: "Standings" },
  { path: "/schedule", label: "Schedule" },
  { path: "/videos", label: "Videos" },
  { path: "/games", label: "Games" },
];

const SwipeNavigator = ({ children }: SwipeNavigatorProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = PAGES.findIndex((p) => p.path === location.pathname);

  const minSwipeDistance = 50;
  const maxPreviewWidth = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    const distance = currentTouch - touchStart;
    
    // Limit the offset for preview effect
    const canGoLeft = currentIndex > 0;
    const canGoRight = currentIndex < PAGES.length - 1;
    
    if ((distance > 0 && canGoLeft) || (distance < 0 && canGoRight)) {
      const limitedOffset = Math.max(-maxPreviewWidth, Math.min(maxPreviewWidth, distance * 0.3));
      setSwipeOffset(limitedOffset);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < PAGES.length - 1) {
      navigate(PAGES[currentIndex + 1].path);
    } else if (isRightSwipe && currentIndex > 0) {
      navigate(PAGES[currentIndex - 1].path);
    }
    
    setSwipeOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    setSwipeOffset(0);
  }, [location.pathname]);

  const leftPage = currentIndex > 0 ? PAGES[currentIndex - 1] : null;
  const rightPage = currentIndex < PAGES.length - 1 ? PAGES[currentIndex + 1] : null;

  return (
    <div className="relative overflow-hidden">
      {/* Left preview sliver */}
      {leftPage && (
        <div 
          className="fixed left-0 top-0 bottom-0 w-16 z-40 bg-gradient-to-r from-primary/20 to-transparent flex items-center pointer-events-none transition-opacity duration-200"
          style={{ 
            opacity: isSwiping && swipeOffset > 10 ? 1 : 0,
          }}
        >
          <div className="ml-2 -rotate-90 origin-center whitespace-nowrap text-primary font-medium text-sm">
            {leftPage.label}
          </div>
        </div>
      )}

      {/* Right preview sliver */}
      {rightPage && (
        <div 
          className="fixed right-0 top-0 bottom-0 w-16 z-40 bg-gradient-to-l from-primary/20 to-transparent flex items-center justify-end pointer-events-none transition-opacity duration-200"
          style={{ 
            opacity: isSwiping && swipeOffset < -10 ? 1 : 0,
          }}
        >
          <div className="mr-2 rotate-90 origin-center whitespace-nowrap text-primary font-medium text-sm">
            {rightPage.label}
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="transition-transform duration-150"
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {children}
      </div>

      {/* Page indicator dots */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-card/80 backdrop-blur-sm px-3 py-2 rounded-full">
        {PAGES.map((page, i) => (
          <button
            key={page.path}
            onClick={() => navigate(page.path)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
            }`}
            aria-label={`Go to ${page.label}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SwipeNavigator;
