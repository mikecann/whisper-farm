import * as React from "react";
import { WorkersCard } from "@/workers/WorkersCard.tsx";

interface Props {}

export const WorkersPage: React.FC<Props> = ({}) => {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <WorkersCard size={"lg"} />
    </main>
  );
};
