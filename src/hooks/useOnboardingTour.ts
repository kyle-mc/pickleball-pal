import { useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_COMPLETED_KEY = "pickle_onboarding_tour_completed";

export const useOnboardingTour = () => {
  const hasCompletedTour = () => localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
  
  const startTour = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "hsl(var(--background) / 0.8)",
      popoverClass: "pickle-tour-popover",
      steps: [
        {
          popover: {
            title: "Welcome to KC Pickleballers! 🥒",
            description: "Let's take a quick tour to show you around the app and explain how everything works.",
          },
        },
        {
          element: "[data-tour='nav-mymmr']",
          popover: {
            title: "My MMR 📊",
            description: "This is your personal dashboard. See your stats, upcoming events, and quick links.",
            side: isMobile ? "top" : "bottom",
          },
        },
        {
          element: "[data-tour='nav-stats']",
          popover: {
            title: "Stats & Leaderboard 🏆",
            description: "Compare yourself against other players. View the leaderboard, head-to-head stats, and MMR distribution across ranks.",
            side: isMobile ? "top" : "bottom",
          },
        },
        {
          element: "[data-tour='nav-games']",
          popover: {
            title: "Games 🥒",
            description: "View all recorded games and how they affected MMR. You can also add new games here — just pick the winning and losing teams and enter the score!",
            side: isMobile ? "top" : "bottom",
          },
        },
        {
          element: "[data-tour='nav-videos']",
          popover: {
            title: "Videos 🎬",
            description: "Watch game highlights and other pickleball content. You can upload YouTube links or record clips directly from your phone (max 60 seconds).",
            side: isMobile ? "top" : "bottom",
          },
        },
        {
          element: "[data-tour='nav-events']",
          popover: {
            title: "Events 📅",
            description: "See upcoming and past events. RSVP to events, set reminders, and create your own recurring events for the group.",
            side: isMobile ? "top" : "bottom",
          },
        },
        {
          popover: {
            title: "The Ranking System 🎖️",
            description: `
              <div style="text-align:left; line-height:1.6;">
                <p>Your rank is based on your <strong>MMR</strong> (Matchmaking Rating), calculated using the Glicko-2 algorithm.</p>
                <p style="margin-top:8px;"><strong>Ranks:</strong> Bronze → Silver → Gold → Platinum → Diamond → Champion → Grand Champion → Supersonic Legend</p>
                <p style="margin-top:8px;"><strong>Placement:</strong> Your first 10 games are placement matches with a 2x MMR boost. Your rank is hidden until you complete them!</p>
                <p style="margin-top:8px;"><strong>Victory Types:</strong> Bigger blowouts earn more MMR — a Golden Pickle (11-0) gives 1.5x, while a Squeaker (11-9) gives only 0.9x.</p>
              </div>
            `,
          },
        },
        {
          popover: {
            title: "You're All Set! 🥒🎉",
            description: "Start by completing your profile, then get out there and play some games! You can replay this tour anytime from the menu. Good luck!",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
      },
    });

    driverObj.drive();
  }, []);

  return { startTour, hasCompletedTour };
};
