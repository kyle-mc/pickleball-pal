/**
 * Convert SRT subtitle file content into a single searchable transcript string.
 * Strips index numbers, timestamps, and HTML tags. Preserves line order.
 */
export function srtToText(srt: string): string {
  return srt
    // Normalize line endings
    .replace(/\r\n?/g, "\n")
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split("\n").filter(Boolean);
      // Drop the index line (numeric only) and timestamp line
      return lines
        .filter((line, idx) => {
          if (idx === 0 && /^\d+$/.test(line.trim())) return false;
          if (/-->/i.test(line)) return false;
          return true;
        })
        .join(" ");
    })
    .filter(Boolean)
    .join("\n")
    // Remove HTML tags like <i>, <b>, <font ...>
    .replace(/<[^>]+>/g, "")
    .trim();
}
