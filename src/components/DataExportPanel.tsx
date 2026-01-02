import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GameRecord } from "@/data/games";

interface DataExportPanelProps {
  games: GameRecord[];
}

const DataExportPanel = ({ games }: DataExportPanelProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Convert games to tab-separated values (TSV) for easy Google Sheets paste
  const generateExportData = () => {
    const headers = ["Game", "Result", "Player", "Score", "MMR Before", "Team MMR", "Team MMR Diff", "MMR After", "MMR Change", "Date"];
    const rows = games.map(g => [
      g.game,
      g.result,
      g.player,
      g.score,
      g.mmrBefore,
      g.teamMmr,
      g.teamMmrDiff,
      g.mmrAfter,
      g.mmrChange,
      g.date,
    ].join("\t"));
    
    return [headers.join("\t"), ...rows].join("\n");
  };

  const handleCopy = async () => {
    const data = generateExportData();
    await navigator.clipboard.writeText(data);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Data copied to clipboard. Paste directly into Google Sheets.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const data = generateExportData();
    const blob = new Blob([data], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `games-export-${new Date().toISOString().split('T')[0]}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "TSV file downloaded. Open with Google Sheets or Excel.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Export Game Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-muted-foreground text-sm">
            Copy this data and paste directly into Google Sheets. The data is tab-separated for easy import.
          </p>
          
          <Textarea 
            value={generateExportData()}
            readOnly
            className="bg-muted border-border font-mono text-xs h-64"
          />

          <div className="flex gap-3">
            <Button onClick={handleCopy} variant="hero" className="flex-1">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="border-border">
              <Download className="w-4 h-4 mr-2" />
              Download TSV
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            Showing {games.length} game records ready for export.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataExportPanel;
