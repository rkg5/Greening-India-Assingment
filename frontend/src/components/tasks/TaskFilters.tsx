import { Button } from "@/components/ui/button";
import type { TaskStatus } from "@/types";

const STATUS_FILTERS: { label: string; value: TaskStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "Done", value: "done" },
];

interface TaskFiltersProps {
  statusFilter: TaskStatus | "all";
  onStatusChange: (v: TaskStatus | "all") => void;
  assignedToMe: boolean;
  onAssignedToMeChange: (v: boolean) => void;
}

export default function TaskFilters({
  statusFilter,
  onStatusChange,
  assignedToMe,
  onAssignedToMeChange,
}: TaskFiltersProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUS_FILTERS.map(({ label, value }) => (
        <Button
          key={value}
          variant={statusFilter === value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(value)}
        >
          {label}
        </Button>
      ))}
      <Button
        variant={assignedToMe ? "default" : "outline"}
        size="sm"
        onClick={() => onAssignedToMeChange(!assignedToMe)}
      >
        Assigned to me
      </Button>
    </div>
  );
}
