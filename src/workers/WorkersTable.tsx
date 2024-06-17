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

interface Props {}

export const WorkersTable: React.FC<Props> = ({}) => {
  const workers = useQuery(api.workers.list);
  const destroyWorker = useMutation(api.workers.destroyWorker);
  const startWorker = useMutation(api.workers.startWorker);
  const onApiError = useApiError();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Id</TableHead>
          <TableHead className="w-[260px]">Machine Id</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workers?.map((worker) => (
          <TableRow key={worker._id}>
            <TableCell>{worker._id}</TableCell>
            <TableCell>{worker.machineId}</TableCell>
            <TableCell>{worker.status.kind}</TableCell>
            <TableCell className="text-right">
              {worker.status.kind == "stopped" && (
                <div className={"flex justify-end gap-2"}>
                  <Button
                    size={"icon"}
                    onClick={() => startWorker({ id: worker._id }).catch(onApiError)}
                  >
                    <PlayIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={"destructive"}
                    size={"icon"}
                    onClick={() => destroyWorker({ id: worker._id }).catch(onApiError)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
