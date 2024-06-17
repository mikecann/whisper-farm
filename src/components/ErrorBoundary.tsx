import * as React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { useToast } from "@/components/ui/use-toast.ts";

interface Props {
  children?: React.ReactNode;
}

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const { toast } = useToast();
  return (
    <ReactErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(err) =>
        toast({
          title: "An error occurred",
          description: err.message,
        })
      }
    >
      {children}
    </ReactErrorBoundary>
  );
};
