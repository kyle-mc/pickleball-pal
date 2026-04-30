/**
 * Helpers for displaying player names. Players have a primary `name` (the
 * unique in-game key — used by the games table), an optional `first_name`
 * override (so two players can share the same display first name), and an
 * optional `last_name`.
 *
 * Disambiguation rule:
 *   - One player with display first name "Billy" → "Billy"
 *   - Billy Smith + Billy Jones        → "Billy S." / "Billy J."
 *   - Billy Smith + Billy Stange       → "Billy Sm." / "Billy St."
 *   - Billy Smith + Billy Smithson     → "Billy Smith." / "Billy Smiths."
 */

export interface PlayerNameInfo {
  name: string;
  first_name?: string | null;
  last_name?: string | null;
}

/** First-name shown to users (override falls back to the unique `name` key). */
export function displayFirstName(p: Pick<PlayerNameInfo, "name" | "first_name">): string {
  const f = (p.first_name || "").trim();
  return f || p.name;
}

/**
 * Build a map: players.name → final display label, with smart prefix-based
 * disambiguation across players that share a display first name.
 */
export function buildDisplayNameMap(
  players: PlayerNameInfo[]
): Record<string, string> {
  const result: Record<string, string> = {};

  // Group by their displayed first name.
  const byFirst = new Map<string, PlayerNameInfo[]>();
  for (const p of players) {
    if (!p?.name) continue;
    const first = displayFirstName(p);
    const arr = byFirst.get(first) || [];
    arr.push(p);
    byFirst.set(first, arr);
  }

  for (const [first, group] of byFirst) {
    if (group.length <= 1) {
      const only = group[0];
      result[only.name] = first;
      continue;
    }

    const lasts = group.map((p) => (p.last_name || "").trim());
    group.forEach((p, idx) => {
      const last = lasts[idx];
      if (!last) {
        result[p.name] = first;
        return;
      }
      let prefixLen = 1;
      while (prefixLen <= last.length) {
        const myPrefix = last.slice(0, prefixLen).toLowerCase();
        const conflict = lasts.some((other, j) => {
          if (j === idx) return false;
          if (!other) return false;
          return other.slice(0, prefixLen).toLowerCase() === myPrefix;
        });
        if (!conflict) break;
        prefixLen++;
      }
      const shown = last.slice(0, Math.min(prefixLen, last.length));
      const pretty = shown.charAt(0).toUpperCase() + shown.slice(1);
      result[p.name] = `${first} ${pretty}.`;
    });
  }

  return result;
}

/** Single-player formatter (no disambiguation context). */
export function formatPlayerName(player: PlayerNameInfo | null | undefined): string {
  if (!player) return "";
  const first = displayFirstName(player);
  const last = (player.last_name || "").trim();
  if (!last) return first;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

/**
 * Resolve a display label given a `players.name` and a precomputed display map.
 * Falls back to the raw name if not in the map.
 */
export function formatNameByLookup(
  name: string,
  lookup: Record<string, string | null | undefined>
): string {
  const v = lookup[name];
  if (typeof v === "string" && v.length > 0) return v;
  return name;
}
