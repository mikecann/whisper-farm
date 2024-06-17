import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { PlusCircleIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SkeletonCard } from "@/components/SkeletonCard.tsx";
import { cn } from "@/lib/utils.ts";
import { match } from "ts-pattern";
import { TasksTable } from "@/tasks/TasksTable.tsx";
import { NewTaskDialog } from "@/tasks/NewTaskDialog.tsx";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const TasksCard: React.FC<Props> = ({ className, size = "sm", ...rest }) => {
  const tasks = useQuery(api.tasks.listTasks);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = React.useState(false);

  return (
    <Card
      className={cn(
        className,
        `xl:col-span-2`,
        match(size)
          .with("sm", () => "max-w-2xl")
          .with("md", () => "max-w-3xl")
          .with("lg", () => "")
          .exhaustive(),
      )}
      {...rest}
    >
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Transcribe tasks.</CardDescription>
        </div>
        {tasks == null ? null : (
          <Button asChild size="sm" className="ml-auto gap-1">
            <Button onClick={() => setIsNewTaskDialogOpen(true)}>
              Create Task
              <PlusCircleIcon className="h-4 w-4" />
            </Button>
          </Button>
        )}
      </CardHeader>
      <CardContent>{tasks == null ? <SkeletonCard /> : <TasksTable />}</CardContent>
      <NewTaskDialog
        open={isNewTaskDialogOpen}
        onCompleted={() => setIsNewTaskDialogOpen(false)}
        onOpenChange={setIsNewTaskDialogOpen}
      />
    </Card>
  );
};
