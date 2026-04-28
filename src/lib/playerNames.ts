/**
 * Helpers for displaying player names. Players have a primary `name` and an
 * optional `last_name`. We display "First L." (initial of last name) when the
 * last name is available, falling back to the primary name otherwise.
 */
export interface PlayerNameInfo {
  name: string;
  last_name?: string | null;
}

export function formatPlayerName(player: PlayerNameInfo | null | undefined): string {
  if (!player) return "";
  const last = (player.last_name || "").trim();
  if (!last) return player.name;
  return `${player.name} ${last.charAt(0).toUpperCase()}.`;
}

export function formatNameByLookup(
  name: string,
  lookup: Record<string, string | null | undefined>
): string {
  const last = (lookup[name] || "").trim();
  if (!last) return name;
  return `${name} ${last.charAt(0).toUpperCase()}.`;
}
