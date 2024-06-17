import { useToast } from "@/components/ui/use-toast.ts";
import { useCallback } from "react";

export const useErrorHandler = () => {
  const { toast } = useToast();
  return useCallback(
    (err: any) => {
      toast({
        title: "Whoopsie!",
        description: `${err}`,
        variant: "destructive",
      });
    },
    [toast],
  );
};

export const useApiError = useErrorHandler;
