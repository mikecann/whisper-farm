import { startHealthCheckServer } from "@worker/healthcheck.ts";
import { configure } from "@worker/config.ts";
import dotenv from "dotenv";
import { ConvexClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { startWorkLoop } from "@worker/work.ts";
import { __dirname, __filename } from "@worker/files.ts";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import { wait } from "@shared/misc.ts";
import { $ } from "bun";

dotenv.config({ path: [".env", ".env.local"] });

const healthCheckServer = startHealthCheckServer();

async function main() {
  const { machineId } = configure();
  console.log("Starting up..", {
    machineId,
    rootUrl: import.meta.url,
    __filename,
    __dirname,
    ffmpeg,
  });

  const client = new ConvexClient(`https://basic-bird-794.convex.cloud`);

  console.log(`Letting convex know we are here`);
  const workerId = await client.mutation(api.workers.workerStarted, { machineId });

  try {
    await startWorkLoop({ client, workerId });
  } finally {
    console.log(`Letting convex know we are stopping`);
    await client.mutation(api.workers.workerStopped, { machineId });
  }

  return "Done";
}
main()
  .then(console.log)
  .catch(console.error)
  .finally(() => {
    healthCheckServer.close();
    process.exit(0);
  });
