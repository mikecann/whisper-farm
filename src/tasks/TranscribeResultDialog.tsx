import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogProps,
  DialogTitle,
} from "@/components/ui/dialog";
import { TranscriptionResult } from "@shared/whisper.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

interface Props extends DialogProps {
  result: TranscriptionResult;
}

export const TranscribeResultDialog: React.FC<Props> = ({ result, ...rest }) => {
  return (
    <Dialog {...rest}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transcribe Result</DialogTitle>
        </DialogHeader>
        <Table containerClassname="h-fit max-h-80 overflow-y-auto relative">
          <TableHeader>
            <TableRow>
              <TableHead className="w-5">Index</TableHead>
              <TableHead className="">Text</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.segments.map((segment, i) => (
              <TableRow key={i}>
                <TableCell>{i}</TableCell>
                <TableCell>{segment.text}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};
