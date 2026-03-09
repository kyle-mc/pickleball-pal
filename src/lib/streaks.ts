// Streak calculation utilities

export interface PlayerStreaks {
  currentWinStreak: number;
  currentLoseStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}

interface GameRecord {
  date: string;
  game: number;
  result: string;
}

export function calculateStreaks(games: GameRecord[]): PlayerStreaks {
  // Sort chronologically (oldest first)
  const sorted = [...games].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.game - b.game;
  });

  let currentWinStreak = 0;
  let currentLoseStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let tempWin = 0;
  let tempLose = 0;

  for (const g of sorted) {
    if (g.result === "Winner") {
      tempWin++;
      tempLose = 0;
      if (tempWin > longestWinStreak) longestWinStreak = tempWin;
    } else {
      tempLose++;
      tempWin = 0;
      if (tempLose > longestLoseStreak) longestLoseStreak = tempLose;
    }
  }

  currentWinStreak = tempWin;
  currentLoseStreak = tempLose;

  return { currentWinStreak, currentLoseStreak, longestWinStreak, longestLoseStreak };
}
