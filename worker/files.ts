import { fileURLToPath } from "url";
import path from "path";
import { readFile, remove, writeFile } from "fs-extra";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export async function downloadFile(url: string, filePath: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await writeFile(filePath, buffer);
    console.log(`File downloaded and saved to ${filePath}`);
  } catch (error) {
    console.error(`Error downloading file: ${error}`);
  }
}

export const storeFiles = async ({
  filePaths,
  client,
}: {
  filePaths: string[];
  client: ConvexClient;
}): Promise<Id<"_storage">[]> => {
  const store = async (file: string) => {
    console.log(`beginning storage of`, file);

    try {
      console.log(`getting upload url from convex..`);
      const uploadUrl = await client.mutation(api.tasks.generateUploadUrl, {});

      console.log(`reading file contents`, file);
      const fileBuffer = await readFile(file);

      // Step 3: POST the file to the URL
      console.log(`uploading ${fileBuffer.length} bytes to convex`, file);
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: fileBuffer,
      });

      if (!result.ok) throw new Error(`Failed to upload ${file}: ${result.statusText}`);

      const output = await result.json();

      console.log(`File uploaded successfully: ${file}`, output);
      return output.storageId as Id<"_storage">;
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
      throw error;
    }
  };

  // Loop through all files and store them
  return Promise.all(filePaths.map(store));
};
