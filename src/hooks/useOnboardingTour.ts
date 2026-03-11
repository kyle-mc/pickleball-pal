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
          element: isMobile ? "[data-tour='mobile-nav-mymmr']" : "[data-tour='nav-my mmr']",
          popover: {
            title: "My MMR 📊",
            description: "This is your personal dashboard. See your stats, upcoming events, and quick links.",
            side: isMobile ? "top" : "bottom",
            align: "center",
          },
        },
        {
          element: isMobile ? "[data-tour='mobile-nav-stats']" : "[data-tour='nav-stats']",
          popover: {
            title: "Stats & Leaderboard 🏆",
            description: "Compare yourself against other players. View the leaderboard, head-to-head stats, and MMR distribution across ranks.",
            side: isMobile ? "top" : "bottom",
            align: "center",
          },
        },
        {
          element: isMobile ? "[data-tour='mobile-nav-games']" : "[data-tour='nav-games']",
          popover: {
            title: "Games 🏓",
            description: "View all recorded games and how they affected MMR. You can also add new games here — just pick the winning and losing teams and enter the score!",
            side: isMobile ? "top" : "bottom",
            align: "center",
          },
        },
        {
          element: isMobile ? "[data-tour='mobile-nav-videos']" : "[data-tour='nav-videos']",
          popover: {
            title: "Videos 🎬",
            description: "Watch game highlights and other pickleball content. You can upload YouTube links or record clips directly from your phone (max 60 seconds).",
            side: isMobile ? "top" : "bottom",
            align: "center",
          },
        },
        {
          element: isMobile ? "[data-tour='mobile-nav-events']" : "[data-tour='nav-events']",
          popover: {
            title: "Events 📅",
            description: "See upcoming and past events. RSVP to events, set reminders, and create your own recurring events for the group.",
            side: isMobile ? "top" : "bottom",
            align: "center",
          },
        },
        {
          element: isMobile ? "[data-tour='mobile-nav-chat']" : "[data-tour='nav-chat']",
          popover: {
            title: "Group Chat 💬",
            description: "Jump into the group chat to coordinate games, talk trash, and stay connected with the crew.",
            side: isMobile ? "top" : "bottom",
            align: "center",
          },
        },
        {
          popover: {
            title: "The Ranking System 🎖️",
            description: `
              <div style="text-align:left; line-height:1.8; font-size: 14px;">
                <p>Your rank is based on your <strong>MMR</strong> (Matchmaking Rating), calculated using the Glicko-2 algorithm.</p>
                <p style="margin-top:8px;"><strong>Ranks:</strong> Bronze → Silver → Gold → Platinum → Diamond → Champion → Grand Champion → Supersonic Legend</p>
                <p style="margin-top:8px;"><strong>Victory Types:</strong></p>
                <ul style="margin-top:4px; padding-left:16px;">
                  <li>🥒 <strong>Pickled</strong> (11-0) → 1.5x MMR</li>
                  <li>🏆🥒 <strong>Golden Pickle</strong> (11-0, opponent never served) → 2x MMR</li>
                  <li>🐁 <strong>Squeaker</strong> (11-9) → 0.9x MMR</li>
                  <li>🔥 <strong>Clutch God</strong> (OT win) → +2pt bonus</li>
                </ul>
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
