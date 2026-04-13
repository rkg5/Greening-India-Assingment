import { ListTodo, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Unknown date";
  }
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md hover:ring-foreground/20 active:scale-[0.99]"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="truncate">{project.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {project.description ?? "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ListTodo className="h-4 w-4" />
            <span>{project.task_count} tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{project.user_count} {project.user_count === 1 ? 'person' : 'people'}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Created {formatDate(project.created_at)}</p>
      </CardContent>
    </Card>
  );
}
