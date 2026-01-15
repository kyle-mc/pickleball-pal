import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, UserPlus } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";

interface HostAssignmentSearchProps {
  currentHosts: string[];
  onHostsChange: (hosts: string[]) => void;
}

const HostAssignmentSearch = ({ currentHosts, onHostsChange }: HostAssignmentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: players = [] } = usePlayers();

  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return players
      .filter(p => p.toLowerCase().includes(query) && !currentHosts.includes(p))
      .slice(0, 5);
  }, [searchQuery, players, currentHosts]);

  const addHost = (playerName: string) => {
    if (!currentHosts.includes(playerName)) {
      onHostsChange([...currentHosts, playerName]);
    }
    setSearchQuery("");
  };

  const removeHost = (playerName: string) => {
    onHostsChange(currentHosts.filter(h => h !== playerName));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search players to add as hosts..."
          className="pl-10 bg-muted border-border"
        />
      </div>

      {filteredPlayers.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          {filteredPlayers.map((player) => (
            <button
              key={player}
              onClick={() => addHost(player)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between transition-colors"
            >
              <span className="text-foreground">{player}</span>
              <UserPlus className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {currentHosts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentHosts.map((host) => (
            <Badge
              key={host}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {host}
              <button
                onClick={() => removeHost(host)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostAssignmentSearch;
