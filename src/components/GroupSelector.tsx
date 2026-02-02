import { useGroupContext } from "@/contexts/GroupContext";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const GroupSelector = () => {
  const { currentGroup, isLoading } = useGroupContext();

  if (isLoading) {
    return null;
  }

  // Simple badge showing current group - no dropdown for single-group mode
  return (
    <Badge variant="outline" className="gap-1.5 px-2 py-1 text-xs font-normal">
      <Users className="w-3 h-3" />
      {currentGroup?.name || "KC Pickleballers"}
    </Badge>
  );
};
