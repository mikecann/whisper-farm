import { ConvexClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { downloadFile, storeFiles } from "@worker/files.ts";
import { transcribe } from "@worker/whisper.ts";
import * as fs from "fs";
import { match } from "ts-pattern";
import { wait } from "@shared/misc.ts";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import { chunkingJobCompleted } from "@convex/workers.ts";
import { sliceAudioAndOutputFiles } from "@worker/audio.ts";
import { readdir } from "fs/promises";
import { ensureDir, readFile, removeSync } from "fs-extra";

export const startWorkLoop = async ({
  client,
  workerId,
}: {
  client: ConvexClient;
  workerId: Id<"workers">;
}) => {
  let noWorkCycleCount = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("Attempting to claim a job..");
    const job = await client.mutation(api.workers.claimWork, { workerId });

    if (!job) {
      console.log("Failed to claim a job, exiting..");

      if (noWorkCycleCount >= 3) {
        console.log(`max no work cycle count reached, exiting..`);
        return;
      }

      noWorkCycleCount++;
      await wait(1000);
      break;
    }

    noWorkCycleCount = 0;

    console.log("Claimed job", job);

    await match(job.payload)
      .with({ kind: "transcribe" }, () => workOnTranscribe({ job, client }))
      .with({ kind: "chunk" }, () => workOnChunk({ job, client }))
      .exhaustive();

    console.log("Done with job, waiting for next..");
  }
};

export const workOnTranscribe = async ({
  job,
  client,
}: {
  job: Doc<"jobs">;
  client: ConvexClient;
}) => {
  if (job.payload.kind != "transcribe") throw new Error(`Job must be a transcribe job`);

  const inputAudioFilename = `job_${job._id}.mp3`;
  const workingDir = `${__dirname}/../`;
  const inputAudioFilePath = `${workingDir}${inputAudioFilename}`;

  try {
    await downloadFile(job.payload.inputAudioUrl, inputAudioFilePath);
    const result = await transcribe({ inputAudioFilePath });
    console.log(`Transcription output`, result);
    await client.mutation(api.workers.transcribeJobCompleted, { jobId: job._id, result });
  } catch (e) {
    console.error(`Error transcribing job`, e);
    throw e;
  } finally {
    // Make sure we tidy up
    removeSync(inputAudioFilePath);
  }
};

export const workOnChunk = async ({ job, client }: { job: Doc<"jobs">; client: ConvexClient }) => {
  if (job.payload.kind != "chunk") throw new Error(`Job must be a chunk job`);

  const inputAudioFilename = `job_${job._id}.mp3`;
  const workingDir = `${__dirname}/../job-tmp-${job._id}`;
  const inputAudioFilePath = `${workingDir}/${inputAudioFilename}`;
  const chunksOutputDir = `${workingDir}/out`;

  try {
    await ensureDir(workingDir);

    await downloadFile(job.payload.inputAudioUrl, inputAudioFilePath);

    await sliceAudioAndOutputFiles({
      inputFilePath: inputAudioFilePath,
      outputDirectoryPath: chunksOutputDir,
      chunkSizeSeconds: job.payload.chunkLengthSeconds,
    });

    const files = await readdir(chunksOutputDir);
    console.log(`chunk output directory has ${files.length} files in it`, files);

    const storageIds = await storeFiles({
      filePaths: files.map((file) => `${chunksOutputDir}/${file}`),
      client,
    });

    // For now just use the input as the chunk
    await client.mutation(api.workers.chunkingJobCompleted, {
      jobId: job._id,
      resultingChunkStorageIds: storageIds,
    });
  } catch (e) {
    console.error(`Error chunking job`, e);
    throw e;
  } finally {
    // Make sure we tidy up
    removeSync(workingDir);
  }
};
