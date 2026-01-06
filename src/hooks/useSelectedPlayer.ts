import { useState, useEffect } from "react";

const STORAGE_KEY = "pickleplay-selected-player";

export const useSelectedPlayer = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  useEffect(() => {
    if (selectedPlayer) {
      localStorage.setItem(STORAGE_KEY, selectedPlayer);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedPlayer]);

  return { selectedPlayer, setSelectedPlayer };
};
