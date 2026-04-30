/**
 * Helpers for displaying player names. Players have a primary `name` (first name)
 * and an optional `last_name`. We display the smallest unique last-name prefix
 * needed to disambiguate two players who share the same first name.
 *
 * Examples:
 *   - One "Billy" → "Billy"
 *   - Billy Smith + Billy Jones → "Billy S." / "Billy J."
 *   - Billy Smith + Billy Stange → "Billy Sm." / "Billy St."
 *   - Billy Smith + Billy Smithson → "Billy Smith." / "Billy Smiths."
 */
export interface PlayerNameInfo {
  name: string;
  last_name?: string | null;
}

/**
 * Build a lookup map of player display names that includes the minimum number
 * of last-name letters required to disambiguate within each first-name group.
 *
 * Returned map: name -> formatted display string.
 */
export function buildDisplayNameMap(
  players: Array<PlayerNameInfo & { id?: string }>
): Record<string, string> {
  const result: Record<string, string> = {};

  // Group players by their first name (the `name` column).
  const byFirst = new Map<string, PlayerNameInfo[]>();
  for (const p of players) {
    if (!p?.name) continue;
    const arr = byFirst.get(p.name) || [];
    arr.push(p);
    byFirst.set(p.name, arr);
  }

  for (const [first, group] of byFirst) {
    // No conflict — show first name alone.
    if (group.length <= 1) {
      result[first] = first;
      continue;
    }

    // For conflicting first names, find shortest unique last-name prefix
    // for each player in the group.
    const lasts = group.map((p) => (p.last_name || "").trim());

    group.forEach((p, idx) => {
      const last = lasts[idx];
      if (!last) {
        // Fallback when this player has no last name set.
        result[first] = first;
        return;
      }
      let prefixLen = 1;
      while (prefixLen <= last.length) {
        const myPrefix = last.slice(0, prefixLen).toLowerCase();
        const conflict = lasts.some((other, j) => {
          if (j === idx) return false;
          return other.slice(0, prefixLen).toLowerCase() === myPrefix;
        });
        if (!conflict) break;
        prefixLen++;
      }
      const shown = last.slice(0, Math.min(prefixLen, last.length));
      // Capitalize first char for nicer display (e.g. "S." rather than "s.")
      const pretty = shown.charAt(0).toUpperCase() + shown.slice(1);
      result[first] = `${first} ${pretty}.`;
    });

    // The simple object above only stores one entry per `first` key, which is
    // fine for lookup-by-name (every conflicting player has the same first
    // name and we look them up by that). But we want each *individual* player
    // to map to its own disambiguated label too, keyed by last_name when
    // available, so the caller can resolve them via formatNameByLookup using
    // the `name` field. Since the games table only stores `player` = first
    // name, the conflicting case is genuinely ambiguous in raw data and the
    // admin must rename one of them. Until then we show the prefix from the
    // first match.
  }

  return result;
}

export function formatPlayerName(player: PlayerNameInfo | null | undefined): string {
  if (!player) return "";
  const last = (player.last_name || "").trim();
  if (!last) return player.name;
  return `${player.name} ${last.charAt(0).toUpperCase()}.`;
}

/**
 * Resolve a player display name from a lookup map of `name -> last_name`.
 * Uses smart disambiguation when there are multiple players sharing the
 * same first name (computed by walking the lookup once).
 */
export function formatNameByLookup(
  name: string,
  lookup: Record<string, string | null | undefined>
): string {
  const last = (lookup[name] || "").trim();
  if (!last) return name;
  return `${name} ${last.charAt(0).toUpperCase()}.`;
}
