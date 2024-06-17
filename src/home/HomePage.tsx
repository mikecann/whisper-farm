import * as React from "react";
import { WorkersCard } from "@/workers/WorkersCard.tsx";
import { TasksCard } from "@/tasks/TasksCard.tsx";
import { NewTaskDialog } from "@/tasks/NewTaskDialog.tsx";
import { JobsCard } from "@/jobs/JobsCard.tsx";

interface Props {
  children?: React.ReactNode;
}

export const HomePage: React.FC<Props> = ({ children }) => {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <TasksCard size={"lg"} />
      <JobsCard size={"lg"} />
      <WorkersCard size={"lg"} />
    </main>
  );
};
