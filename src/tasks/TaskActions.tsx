import * as React from "react";
import { Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button.tsx";
import { PlayIcon, TrashIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { useApiError } from "@/lib/errors.ts";
import { TranscribeResultDialog } from "@/tasks/TranscribeResultDialog.tsx";
import { api } from "../../convex/_generated/api";

interface Props {
  task: Doc<"tasks">;
}

export const TaskActions: React.FC<Props> = ({ task }) => {
  const destroyTask = useMutation(api.tasks.destroyTask);
  const startTask = useMutation(api.tasks.startTask);
  const onApiError = useApiError();
  const [isResultDialogOpen, setIsResultDialogOpen] = React.useState(false);

  if (task.status.kind == "not_started")
    return (
      <>
        <Button size={"icon"} onClick={() => startTask({ id: task._id }).catch(onApiError)}>
          <PlayIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={"destructive"}
          size={"icon"}
          onClick={() => destroyTask({ id: task._id }).catch(onApiError)}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </>
    );

  if (task.status.kind == "finished")
    return (
      <>
        <Button onClick={() => setIsResultDialogOpen(true)}>View Result</Button>
        <TranscribeResultDialog
          result={task.status.result}
          open={isResultDialogOpen}
          onOpenChange={setIsResultDialogOpen}
        />
      </>
    );

  return null;
};
