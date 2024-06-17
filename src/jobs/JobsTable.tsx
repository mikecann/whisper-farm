import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { match } from "ts-pattern";

interface Props {}

export const JobsTable: React.FC<Props> = ({}) => {
  const jobs = useQuery(api.jobs.list);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Id</TableHead>
          <TableHead className="w-[260px]">Task</TableHead>
          <TableHead className="w-[260px]">Kind</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs?.map((job) => (
          <TableRow key={job._id}>
            <TableCell>{job._id}</TableCell>
            <TableCell>{job.partOfTaskId}</TableCell>
            <TableCell>{job.payload.kind}</TableCell>
            <TableCell
              className={match(job.status.kind)
                .with("finished", () => "text-green-300")
                .with("pending", () => "text-blue-300")
                .with("in_progress", () => "text-yellow-300")
                .exhaustive()}
            >
              {job.status.kind}
            </TableCell>
            <TableCell className="text-right">
              <div className={"flex justify-end gap-2"}>
                {/*<Button size={"icon"} onClick={() => startTask({ id: job._id }).catch(onApiError)}>*/}
                {/*  <PlayIcon className="h-4 w-4" />*/}
                {/*</Button>*/}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
