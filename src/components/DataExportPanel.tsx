import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGames } from "@/hooks/useGames";
import { SEASONS } from "@/lib/seasons";

type Mode = "all" | "season" | "date_range";

interface Props {
  /** When provided, replaces the default Button trigger. */
  trigger?: React.ReactNode;
}

const DataExportPanel = ({ trigger }: Props) => {
  const { toast } = useToast();
  const { data: games = [], isLoading } = useGames("all", "all");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [mode, setMode] = useState<Mode>("all");
  const [season, setSeason] = useState<string>(String(SEASONS[SEASONS.length - 1]?.id ?? 2));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includeSingles, setIncludeSingles] = useState(true);
  const [includeDoubles, setIncludeDoubles] = useState(true);

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (mode === "season" && g.season !== parseInt(season)) return false;
      if (mode === "date_range") {
        if (fromDate && g.date < fromDate) return false;
        if (toDate && g.date > toDate) return false;
      }
      const m = g.gameMode || "doubles";
      if (m === "singles" && !includeSingles) return false;
      if (m === "doubles" && !includeDoubles) return false;
      return true;
    });
  }, [games, mode, season, fromDate, toDate, includeSingles, includeDoubles]);

  const generateExportData = () => {
    const headers = ["Game", "Result", "Player", "Mode", "Score", "MMR Before", "Team MMR", "Team MMR Diff", "MMR After", "MMR Change", "Season", "Date"];
    const rows = filtered.map((g) =>
      [
        g.game,
        g.result,
        g.player,
        g.gameMode || "doubles",
        g.score,
        g.mmrBefore,
        g.teamMmr,
        g.teamMmrDiff,
        g.mmrAfter,
        g.mmrChange,
        g.season ?? "",
        g.date,
      ].join("\t")
    );
    return [headers.join("\t"), ...rows].join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateExportData());
    setCopied(true);
    toast({ title: "Copied!", description: "Data copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const data = generateExportData();
    const blob = new Blob([data], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const tag =
      mode === "all" ? "all" : mode === "season" ? `season-${season}` : `${fromDate || "start"}_to_${toDate || "end"}`;
    a.download = `games-export-${tag}-${new Date().toISOString().split("T")[0]}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "TSV file ready to open in Sheets/Excel." });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="border-border">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Export Game Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Filter</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All games (all seasons)</SelectItem>
                  <SelectItem value="season">By season</SelectItem>
                  <SelectItem value="date_range">By date range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "season" && (
              <div className="space-y-1">
                <Label className="text-xs">Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEASONS.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        Season {s.id} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {mode === "date_range" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox checked={includeDoubles} onCheckedChange={(v) => setIncludeDoubles(!!v)} /> Doubles
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={includeSingles} onCheckedChange={(v) => setIncludeSingles(!!v)} /> Singles
            </label>
          </div>

          <Textarea value={generateExportData()} readOnly className="bg-muted border-border font-mono text-xs h-56" />

          <div className="flex gap-3">
            <Button onClick={handleCopy} variant="hero" className="flex-1" disabled={isLoading}>
              {copied ? (<><Check className="w-4 h-4 mr-2" />Copied!</>) : (<><Copy className="w-4 h-4 mr-2" />Copy</>)}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="border-border" disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Download TSV
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            {filtered.length} of {games.length} game records match the current filter.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataExportPanel;
