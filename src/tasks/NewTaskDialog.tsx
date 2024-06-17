import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogProps,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button.tsx";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { useErrorHandler } from "@/lib/errors.ts";

interface Props extends DialogProps {
  onCompleted?: () => void;
}

export const NewTaskDialog: React.FC<Props> = ({ onCompleted, ...rest }) => {
  const generateUploadUrl = useMutation(api.tasks.generateUploadUrl);
  const createTask = useMutation(api.tasks.createTask);
  const onError = useErrorHandler();
  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);

    // Step 1: Get a short-lived upload URL
    const postUrl = await generateUploadUrl();
    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": selectedImage!.type },
      body: selectedImage,
    });
    const { storageId } = await result.json();
    // Step 3: Save the newly allocated storage id to the database
    await createTask({ storageId });

    setSelectedImage(null);
    imageInput.current!.value = "";
    onCompleted?.();
    setIsUploading(false);
  };

  return (
    <Dialog {...rest}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Create a new Transcribe task</DialogDescription>
          <form onSubmit={(event) => onSubmit(event).catch(onError)}>
            <input
              type="file"
              accept="audio/*"
              ref={imageInput}
              onChange={(event) => setSelectedImage(event.target.files![0])}
              disabled={selectedImage !== null}
            />
            <DialogFooter>
              <Button type="submit" disabled={selectedImage === null || isUploading}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
