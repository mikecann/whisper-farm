import * as React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button.tsx";
import { PlayIcon, TrashIcon } from "lucide-react";
import { useApiError } from "@/lib/errors.ts";
import { TaskActions } from "@/tasks/TaskActions.tsx";
import { match } from "ts-pattern";

interface Props {}

export const TasksTable: React.FC<Props> = ({}) => {
  const tasks = useQuery(api.tasks.listTasks);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Id</TableHead>
          <TableHead className="w-5">File Id</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks?.map((task) => (
          <TableRow key={task._id}>
            <TableCell>{task._id}</TableCell>
            <TableCell>{task.inputAudioStorageId}</TableCell>
            <TableCell
              className={match(task.status.kind)
                .with("not_started", () => "text-gray-400-300")
                .with("chunking", () => "text-yellow-200")
                .with("transcribing", () => "text-yellow-500")
                .with("finished", () => "text-green-300")
                .exhaustive()}
            >
              {task.status.kind}
            </TableCell>
            <TableCell className="text-right">
              <div className={"flex justify-end gap-2"}>
                <TaskActions task={task} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
