import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCreateTask, useUpdateTask, type UpdateTaskInput } from "@/hooks/useTasks";
import { useUserSearch } from "@/hooks/useUserSearch";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/types";

interface TaskPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task;
}

interface FormState {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
  assignee_id: string | null;
}

const DEFAULT_FORM: FormState = {
  title: "",
  description: "",
  priority: "medium",
  due_date: "",
  status: "todo",
  assignee_id: null,
};

export default function TaskPanel({
  open,
  onOpenChange,
  projectId,
  task,
}: TaskPanelProps) {
  const isEdit = !!task;
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);

  // Form is initialized from the task prop on mount.
  // The parent remounts this component (via key prop) each time the panel opens,
  // so the useState initializer always runs fresh — no setState-in-effect needed.
  const [form, setForm] = useState<FormState>(() =>
    task
      ? {
          title: task.title,
          description: task.description ?? "",
          priority: task.priority,
          due_date: task.due_date ?? "",
          status: task.status,
          assignee_id: task.assignee_id,
        }
      : DEFAULT_FORM
  );
  const [error, setError] = useState<string | null>(null);
  const [assigneeEmail, setAssigneeEmail] = useState(
    task?.assignee_email ?? ""
  );
  const userSearch = useUserSearch();

  const isPending = createTask.isPending || updateTask.isPending;

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      due_date: form.due_date || undefined,
      assignee_id: form.assignee_id ?? undefined,
    };

    if (isEdit) {
      const updatePayload: UpdateTaskInput = {
        ...payload,
        status: form.status,
        assignee_id: form.assignee_id, // null means "unassign"
        assignee_name: userSearch.result ? userSearch.result.name : (form.assignee_id ? task.assignee_name : null),
        assignee_email: userSearch.result ? userSearch.result.email : (form.assignee_id ? task.assignee_email : null),
      };
      updateTask.mutate(
        { taskId: task.id, data: updatePayload },
        {
          onSuccess: () => onOpenChange(false),
          onError: (err: unknown) => {
            const msg =
              (err as { response?: { data?: { error?: string } } })?.response
                ?.data?.error ?? "Failed to update task.";
            setError(msg);
          },
        }
      );
    } else {
      createTask.mutate(payload, {
        onSuccess: () => onOpenChange(false),
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { error?: string } } })?.response
              ?.data?.error ?? "Failed to create task.";
          setError(msg);
        },
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "overflow-y-auto",
          isMobile ? "max-h-[85vh]" : "w-full sm:max-w-md"
        )}
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Task" : "Add Task"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Task title"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, priority: v as TaskPriority }))
              }
              disabled={isPending}
            >
              <SelectTrigger>
                <span className="flex flex-1 text-left">{PRIORITY_LABELS[form.priority]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due-date">Due Date</Label>
            <Input
              id="task-due-date"
              type="date"
              value={form.due_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, due_date: e.target.value }))
              }
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-assignee">Assignee (email)</Label>
            <div className="relative">
              <Input
                id="task-assignee"
                type="email"
                placeholder="colleague@example.com"
                value={assigneeEmail}
                onChange={(e) => {
                  setAssigneeEmail(e.target.value);
                  // If the field is cleared, remove the assignment
                  if (!e.target.value.trim()) {
                    setForm((f) => ({ ...f, assignee_id: null }));
                    userSearch.clear();
                  }
                }}
                onBlur={async (e) => {
                  const email = e.target.value.trim();
                  if (!email) return;
                  const found = await userSearch.search(email);
                  setForm((f) => ({ ...f, assignee_id: found ? found.id : null }));
                }}
                disabled={isPending}
              />
            </div>
            {userSearch.isSearching && (
              <p className="text-xs text-muted-foreground">Looking up user…</p>
            )}
            {userSearch.result && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Assigned to {userSearch.result.name}
              </p>
            )}
            {userSearch.error && (
              <p className="text-xs text-destructive">{userSearch.error}</p>
            )}
          </div>

          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as TaskStatus }))
                }
                disabled={isPending}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left">{STATUS_LABELS[form.status]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 mt-2">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save Changes"
                  : "Add Task"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
