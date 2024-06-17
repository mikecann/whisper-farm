import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SkeletonCard } from "@/components/SkeletonCard.tsx";
import { cn } from "@/lib/utils.ts";
import { match } from "ts-pattern";
import { JobsTable } from "@/jobs/JobsTable.tsx";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const JobsCard: React.FC<Props> = ({ className, size = "sm", ...rest }) => {
  const jobs = useQuery(api.jobs.list);

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
          <CardTitle>Jobs</CardTitle>
          <CardDescription>Sub-tasks that make up the larger Task.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{jobs == null ? <SkeletonCard /> : <JobsTable />}</CardContent>
    </Card>
  );
};
