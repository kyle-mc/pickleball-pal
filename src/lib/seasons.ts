// Season definitions

export interface Season {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null; // null = ongoing
  description: string;
}

export const SEASONS: Season[] = [
  {
    id: 1,
    name: 'Season 1',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    description: 'The inaugural season',
  },
  {
    id: 2,
    name: 'Season 2',
    startDate: '2026-01-01',
    endDate: null,
    description: 'A fresh start with soft MMR reset',
  },
];

export function getCurrentSeason(): Season {
  const now = new Date();
  const year = now.getFullYear();
  return year >= 2026 ? SEASONS[1] : SEASONS[0];
}

export function getSeasonById(id: number): Season | undefined {
  return SEASONS.find(s => s.id === id);
}

export function getSeasonFromDate(dateStr: string): Season {
  const year = parseInt(dateStr.split('-')[0]);
  return year >= 2026 ? SEASONS[1] : SEASONS[0];
}

export function isCurrentSeason(season: Season): boolean {
  return season.endDate === null || new Date(season.endDate) >= new Date();
}
