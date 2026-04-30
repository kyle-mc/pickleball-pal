import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Loader2, Layers, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubmitGame } from "@/hooks/useGames";
import { usePlayers, useAddPlayer } from "@/hooks/usePlayers";
import { useCurrentGroup } from "@/hooks/useGroups";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DraftGame {
  id: string;
  gameMode: 'doubles' | 'singles';
  winners: [string, string];
  losers: [string, string];
  winningScore: string;
  losingScore: string;
}

const newDraft = (template?: DraftGame): DraftGame => ({
  id: crypto.randomUUID(),
  gameMode: template?.gameMode ?? 'doubles',
  winners: template ? [...template.winners] : ["", ""],
  losers: template ? [...template.losers] : ["", ""],
  winningScore: "11",
  losingScore: "0",
});

interface SortableRowProps {
  game: DraftGame;
  index: number;
  players: string[];
  onChange: (g: DraftGame) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  canDelete: boolean;
}

function SortableRow({ game, index, players, onChange, onDelete, onDuplicate, canDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: game.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const renderSelect = (val: string, set: (v: string) => void, ph: string) => (
    <Select value={val} onValueChange={set}>
      <SelectTrigger className="bg-muted border-border h-9 text-sm">
        <SelectValue placeholder={ph} />
      </SelectTrigger>
      <SelectContent className="bg-card border-border z-50 max-h-60">
        {players.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-card/60 p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">Game {index + 1}</span>
        <Select
          value={game.gameMode}
          onValueChange={(v) => onChange({ ...game, gameMode: v as 'doubles' | 'singles' })}
        >
          <SelectTrigger className="h-7 w-28 text-xs bg-muted border-border ml-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="doubles">Doubles</SelectItem>
            <SelectItem value="singles">Singles</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onDuplicate} title="Duplicate row">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={!canDelete}
            title="Remove row"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-primary">Winners</Label>
          {renderSelect(game.winners[0], (v) => onChange({ ...game, winners: [v, game.winners[1]] }), "Player")}
          {game.gameMode === 'doubles' &&
            renderSelect(game.winners[1], (v) => onChange({ ...game, winners: [game.winners[0], v] }), "Player 2")}
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wide text-destructive">Losers</Label>
          {renderSelect(game.losers[0], (v) => onChange({ ...game, losers: [v, game.losers[1]] }), "Player")}
          {game.gameMode === 'doubles' &&
            renderSelect(game.losers[1], (v) => onChange({ ...game, losers: [game.losers[0], v] }), "Player 2")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">W Score</Label>
          <Input
            type="number"
            min={0}
            max={99}
            value={game.winningScore}
            onChange={(e) => onChange({ ...game, winningScore: e.target.value })}
            className="bg-muted border-border h-9"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">L Score</Label>
          <Input
            type="number"
            min={0}
            max={99}
            value={game.losingScore}
            onChange={(e) => onChange({ ...game, losingScore: e.target.value })}
            className="bg-muted border-border h-9"
          />
        </div>
      </div>
    </div>
  );
}

interface BulkGameEntryDialogProps {
  defaultDate?: string;
}

export default function BulkGameEntryDialog({ defaultDate }: BulkGameEntryDialogProps) {
  const { toast } = useToast();
  const { data: players = [] } = usePlayers();
  const submitGameMutation = useSubmitGame();
  const addPlayerMutation = useAddPlayer();
  const { currentGroup } = useCurrentGroup();

  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate || getLocalDateString());
  const [drafts, setDrafts] = useState<DraftGame[]>([newDraft()]);
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setDrafts(prev => {
      const oldIdx = prev.findIndex(d => d.id === active.id);
      const newIdx = prev.findIndex(d => d.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const addRow = () => {
    setDrafts(prev => [...prev, newDraft(prev[prev.length - 1])]);
  };

  const reset = () => {
    setDrafts([newDraft()]);
    setDate(defaultDate || getLocalDateString());
  };

  const validate = (): string | null => {
    if (drafts.length === 0) return "Add at least one game.";
    for (let i = 0; i < drafts.length; i++) {
      const g = drafts[i];
      const need = g.gameMode === 'singles' ? 2 : 4;
      const all = [...g.winners, ...g.losers].filter(Boolean);
      const required = g.gameMode === 'singles'
        ? [g.winners[0], g.losers[0]]
        : [g.winners[0], g.winners[1], g.losers[0], g.losers[1]];
      if (required.some(p => !p)) return `Game ${i + 1}: select all players.`;
      if (new Set(all).size !== need) return `Game ${i + 1}: players must be unique.`;
      const w = parseInt(g.winningScore);
      const l = parseInt(g.losingScore);
      if (isNaN(w) || isNaN(l)) return `Game ${i + 1}: enter valid scores.`;
      if (w <= l) return `Game ${i + 1}: winner score must be higher.`;
      if (w - l < 2) return `Game ${i + 1}: winner must win by 2.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast({ title: "Cannot submit", description: err, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    let okCount = 0;
    try {
      for (const g of drafts) {
        const winners = g.gameMode === 'singles' ? [g.winners[0]] : [g.winners[0], g.winners[1]];
        const losers = g.gameMode === 'singles' ? [g.losers[0]] : [g.losers[0], g.losers[1]];
        for (const p of [...winners, ...losers]) {
          if (!players.includes(p)) await addPlayerMutation.mutateAsync(p).catch(() => {});
        }
        await submitGameMutation.mutateAsync({
          winningPlayers: winners,
          losingPlayers: losers,
          winningScore: parseInt(g.winningScore),
          losingScore: parseInt(g.losingScore),
          date,
          groupId: currentGroup?.id,
          neverServed: false,
          gameMode: g.gameMode,
        });
        okCount++;
      }
      toast({ title: "Games added", description: `${okCount} game${okCount === 1 ? '' : 's'} recorded.` });
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Bulk add failed:", error);
      toast({
        title: "Partial failure",
        description: `Recorded ${okCount} of ${drafts.length}. Error: ${error instanceof Error ? error.message : 'unknown'}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 px-3">
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Bulk Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Bulk Add Games</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Date (applies to all games)</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted border-border" />
          </div>

          <p className="text-xs text-muted-foreground">
            Drag rows to reorder them — the topmost game is treated as the oldest, the bottom as the most recent.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={drafts.map(d => d.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {drafts.map((d, i) => (
                  <SortableRow
                    key={d.id}
                    game={d}
                    index={i}
                    players={players}
                    canDelete={drafts.length > 1}
                    onChange={(updated) => setDrafts(prev => prev.map(x => x.id === d.id ? updated : x))}
                    onDelete={() => setDrafts(prev => prev.filter(x => x.id !== d.id))}
                    onDuplicate={() =>
                      setDrafts(prev => {
                        const idx = prev.findIndex(x => x.id === d.id);
                        const copy = { ...newDraft(d), winningScore: d.winningScore, losingScore: d.losingScore };
                        const next = [...prev];
                        next.splice(idx + 1, 0, copy);
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="outline" onClick={addRow} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add another game
          </Button>

          <Button variant="hero" onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recording {drafts.length} game{drafts.length === 1 ? '' : 's'}...</>
            ) : (
              `Record ${drafts.length} Game${drafts.length === 1 ? '' : 's'}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
