import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { WorkersTable } from "@/workers/WorkersTable.tsx";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SkeletonCard } from "@/components/SkeletonCard.tsx";
import { cn } from "@/lib/utils.ts";
import { match } from "ts-pattern";
import { useApiError } from "@/lib/errors.ts";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const WorkersCard: React.FC<Props> = ({ className, size = "sm", ...rest }) => {
  const createAndStartWorker = useMutation(api.workers.createAndStartWorker);
  const syncWorkersAndMachines = useAction(api.workers.syncWorkersAndMachines);
  const workers = useQuery(api.workers.list);
  const onApiError = useApiError();

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
          <CardTitle>Workers</CardTitle>
          <CardDescription>Current workers in the system.</CardDescription>
        </div>
        {workers == null ? null : (
          <div className="ml-auto flex gap-1">
            <Button asChild size="sm">
              <Button onClick={() => createAndStartWorker().catch(onApiError)}>
                Create Worker
              </Button>
            </Button>
            <Button asChild size="sm">
              <Button onClick={() => syncWorkersAndMachines().catch(onApiError)}>
                Sync Machines & Workers
              </Button>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>{workers == null ? <SkeletonCard /> : <WorkersTable />}</CardContent>
    </Card>
  );
};
