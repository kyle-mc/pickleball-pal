import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroupContext } from "@/contexts/GroupContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, ChevronDown, Plus, Settings } from "lucide-react";
import { GroupBrowserDialog } from "./GroupBrowserDialog";

export const GroupSelector = () => {
  const { groups, currentGroup, setCurrentGroup, isLoading } = useGroupContext();
  const navigate = useNavigate();
  const [showBrowser, setShowBrowser] = useState(false);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 min-w-[120px]">
        <Users className="w-4 h-4" />
        Loading...
      </Button>
    );
  }

  if (groups.length === 0) {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowBrowser(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Join Group
        </Button>
        <GroupBrowserDialog open={showBrowser} onOpenChange={setShowBrowser} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[180px]">
            <Users className="w-4 h-4" />
            <span className="truncate">{currentGroup?.name || "Select Group"}</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border min-w-[200px]">
          {groups.map((membership) => (
            <DropdownMenuItem
              key={membership.id}
              onClick={() => setCurrentGroup(membership.group)}
              className={`cursor-pointer ${
                currentGroup?.id === membership.group.id ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              {membership.group.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowBrowser(true)} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Browse / Create Groups
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Manage Groups
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <GroupBrowserDialog open={showBrowser} onOpenChange={setShowBrowser} />
    </>
  );
};
