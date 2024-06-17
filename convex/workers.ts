import {
  action,
  internalAction,
  internalMutation,
  mutation,
  MutationCtx,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { ensure } from "../shared/ensure";
import { createClient } from "../server/fly/main";
import { iife } from "../shared/misc";
import { transcriptionResultValidator } from "../shared/whisper";
import { Id } from "./_generated/dataModel";
import { MachineState } from "../server/fly/lib/machine";
import { match } from "ts-pattern";
import { isNotNullOrUndefined } from "../shared/filter";

export const createWorker = mutation({
  args: {
    machineId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workers", {
      machineId: args.machineId,
      status: {
        kind: "stopped",
      },
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("workers")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .take(100);
  },
});

export const findWorker = query({
  args: {
    id: v.id("workers"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const destroyWorker = mutation({
  args: {
    id: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const worker = await ctx.db.get(args.id);
    if (worker == null) throw new Error("Worker not found");

    if (worker.status.kind != "stopped") throw new Error("Worker must be stopped to destroy");

    if (worker.deletedAt != null) throw new Error("Worker already destroyed");

    return await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
    });
  },
});

export const createAndStartWorker = mutation({
  args: {},
  handler: async (ctx) => {
    const workerId = await ctx.db.insert("workers", {
      status: {
        kind: "stopped",
      },
    });
    await ctx.scheduler.runAfter(0, internal.workers.startWorkerMachine, { id: workerId });
  },
});

// Start
export const startWorker = mutation({
  args: {
    id: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const worker = await ctx.db.get(args.id);
    if (worker == null) throw new Error("Worker not found");
    if (worker.deletedAt != null) throw new Error("Worker destroyed");
    if (worker.status.kind != "stopped") throw new Error("Worker must be stopped to start it");

    await ctx.db.patch(args.id, {
      status: {
        kind: "starting",
      },
    });

    await ctx.scheduler.runAfter(0, internal.workers.startWorkerMachine, { id: args.id });
  },
});

export const workerStarted = mutation({
  args: {
    machineId: v.string(),
  },
  handler: async (ctx, args) => {
    const worker = await ctx.db
      .query("workers")
      .withIndex("by_machineId", (q) => q.eq("machineId", args.machineId))
      .first();

    if (worker == null) throw new Error("Worker not found");

    if (worker.status.kind != "starting") console.warn("Worker not in the starting state");

    await ctx.db.patch(worker._id, {
      status: {
        kind: "running",
      },
    });

    return worker._id;
  },
});

export const workerStopped = mutation({
  args: {
    machineId: v.string(),
  },
  handler: async (ctx, args) => {
    const worker = await ctx.db
      .query("workers")
      .withIndex("by_machineId", (q) => q.eq("machineId", args.machineId))
      .first();

    if (worker == null) throw new Error("Worker not found");

    await ctx.db.patch(worker._id, {
      status: {
        kind: "stopped",
      },
    });
  },
});

export const workerAboutToStartMachine = internalMutation({
  args: {
    machineId: v.string(),
    workerId: v.id("workers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workerId, {
      machineId: args.machineId,
      status: {
        kind: "starting",
      },
    });
  },
});

export const updateWorkerStatusFromMachineState = internalMutation({
  args: {
    workerId: v.id("workers"),
    state: v.any(),
  },
  handler: async (ctx, args) => {
    const state = args.state as MachineState;
    await ctx.db.patch(args.workerId, {
      status: match(state)
        .with(MachineState.Stopped, () => ({ kind: "stopped" }) as const)
        .with(MachineState.Starting, () => ({ kind: "starting" }) as const)
        .with(MachineState.Created, () => ({ kind: "running" }) as const)
        .with(MachineState.Destroyed, () => ({ kind: "stopped" }) as const)
        .with(MachineState.Destroying, () => ({ kind: "stopped" }) as const)
        .with(MachineState.Replacing, () => ({ kind: "starting" }) as const)
        .with(MachineState.Stopping, () => ({ kind: "running" }) as const)
        .with(MachineState.Started, () => ({ kind: "starting" }) as const)
        .exhaustive(),
    });
  },
});

const flyAppName = `whisper-farm-worker`;

export const startWorkerMachine = internalAction({
  args: {
    id: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const worker = await ctx.runQuery(api.workers.findWorker, { id: args.id });
    if (worker == null) throw new Error("Worker not found");
    if (worker.deletedAt != null) throw new Error("Worker destroyed");
    //if (worker.status.kind != "starting") throw new Error("Worker must not be starting");

    const fly = createClient(ensure(process.env.FLY_API_TOKEN));

    //console.log("Loading machines..");

    const workers = await ctx.runQuery(api.workers.list, {});

    const machines = await fly.Machine.listMachines({ app_name: flyAppName });
    if (!machines.length) throw new Error(`No machines!`);

    const machinesNotAlreadyAssigned = machines.filter(
      (m) => !workers.some((w) => w.machineId === m.id),
    );

    console.log(
      `Found ${machines.length} machines ${machinesNotAlreadyAssigned.length} not already assigned..`,
    );

    const machineId = await iife(async () => {
      const firstStoppedMachine = machinesNotAlreadyAssigned.find((m) => m.state === "stopped");
      if (firstStoppedMachine) {
        console.log(`Found a stopped machine ${firstStoppedMachine.id}`);
        return firstStoppedMachine.id;
      }

      const machineToClone = ensure(machines[0]);
      console.log(`Cloning machine ${machineToClone.id}`);
      const cloned = await fly.Machine.createMachine({
        app_name: flyAppName,
        config: machineToClone.config,
        region: machineToClone.region,
      });

      console.log(`Machine cloned ${machineToClone.id}, using it`);
      return cloned.id;
    });

    await ctx.runMutation(internal.workers.workerAboutToStartMachine, {
      machineId,
      workerId: args.id,
    });

    console.log(`Attempting to start machine ${machineId}..`);
    const response = await fly.Machine.startMachine({
      app_name: flyAppName,
      machine_id: machineId,
    });
    console.log(`Machine started: ${response.ok}`);
  },
});

export const startWorkers = internalAction({
  args: {
    ids: v.array(v.id("workers")),
  },
  handler: async (ctx, args) => {
    const allWorkers = await ctx.runQuery(api.workers.list, {});
    const workers = allWorkers.filter((w) => args.ids.includes(w._id));
    const workersWithMachineIds = workers.filter((w) => w.machineId != null);

    const fly = createClient(ensure(process.env.FLY_API_TOKEN));

    await Promise.all(
      workersWithMachineIds.map(async (worker) => {
        const machineId = ensure(worker.machineId);

        try {
          await Promise.all([
            ctx.runMutation(internal.workers.workerAboutToStartMachine, {
              machineId,
              workerId: worker._id,
            }),
            fly.Machine.startMachine({
              app_name: flyAppName,
              machine_id: machineId,
            }),
          ]);
        } catch (e) {
          console.error(`Failed to start machine ${machineId}`, e);
        }
      }),
    );
  },
});

export const syncWorkersAndMachines = action({
  args: {},
  handler: async (ctx, args) => {
    const fly = createClient(ensure(process.env.FLY_API_TOKEN));
    const machines = await fly.Machine.listMachines({
      app_name: flyAppName,
    });
    const workers = await ctx.runQuery(api.workers.list, {});

    const workersWithoutAMachine = workers.filter(
      (w) => !machines.some((m) => m.id === w.machineId),
    );
    if (workersWithoutAMachine.length > 0) {
      console.log(
        `destroying ${workersWithoutAMachine.length} workers as they dont have a machine associated`,
      );

      await Promise.all(
        workersWithoutAMachine.map((w) =>
          ctx.runMutation(api.workers.destroyWorker, { id: w._id }),
        ),
      );
    }

    for (const machine of machines) {
      const worker = workers.find((w) => w.machineId === machine.id);
      if (!worker) await ctx.runMutation(api.workers.createWorker, { machineId: machine.id });
      else
        await ctx.runMutation(internal.workers.updateWorkerStatusFromMachineState, {
          workerId: worker._id,
          state: machine.state,
        });
    }
  },
});

export const claimWork = mutation({
  args: {
    workerId: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("jobs")
      .withIndex("by_status_kind", (q) => q.eq("status.kind", "pending"))
      .first();

    if (job == null) return null;

    await ctx.db.patch(job._id, {
      status: {
        kind: "in_progress",
        startedAt: Date.now(),
        claimedByWorkerId: args.workerId,
      },
    });

    return job;
  },
});

export const transcribeJobCompleted = mutation({
  args: {
    jobId: v.id("jobs"),
    result: transcriptionResultValidator,
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);

    if (job == null) throw new Error("No job in progress");
    if (job.status.kind != "in_progress") throw new Error("Job not in progress");
    if (job.payload.kind != "transcribe") throw new Error("Job not a transcribe job");

    await ctx.db.patch(job._id, {
      payload: {
        ...job.payload,
        transcribedResult: args.result,
      },
      status: {
        kind: "finished",
      },
    });

    await checkTaskProgress({ taskId: job.partOfTaskId, ctx });
  },
});

export const chunkingJobCompleted = mutation({
  args: {
    jobId: v.id("jobs"),
    resultingChunkStorageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);

    if (job == null) throw new Error("No job in progress");
    if (job.status.kind != "in_progress") throw new Error("Job not in progress");
    if (job.payload.kind != "chunk") throw new Error("Job not a transcribe job");

    await ctx.db.patch(job._id, {
      payload: {
        ...job.payload,
        resultingChunkStorageIds: args.resultingChunkStorageIds,
      },
      status: {
        kind: "finished",
      },
    });

    await checkTaskProgress({ taskId: job.partOfTaskId, ctx });
    await ctx.scheduler.runAfter(0, internal.workers.checkAndStartWorkersIfNeeded, {});
  },
});

export const checkAndStartWorkersIfNeeded = internalAction({
  args: {},
  handler: async (ctx) => {
    const pendingJobs = await ctx.runQuery(api.jobs.listPending, {});
    if (pendingJobs.length == 0) return;

    const workers = await ctx.runQuery(api.workers.list, {});
    const stoppedWorkers = workers.filter((w) => w.status.kind === "stopped");

    const jobWorkerPairs = pendingJobs
      .map((j) => {
        const worker = stoppedWorkers.pop();
        if (!worker) return null;
        return { job: j, worker };
      })
      .filter(isNotNullOrUndefined);

    if (jobWorkerPairs.length == 0) return;

    await ctx.runAction(internal.workers.startWorkers, {
      ids: jobWorkerPairs.map((j) => j.worker._id),
    });
  },
});

const checkTaskProgress = async ({ taskId, ctx }: { taskId: Id<"tasks">; ctx: MutationCtx }) => {
  const allJobsInTask = await ctx.db
    .query("jobs")
    .withIndex("by_partOfTaskId", (q) => q.eq("partOfTaskId", taskId))
    .take(100);

  const chunkingJobs = allJobsInTask.filter((j) => j.payload.kind === "chunk");
  const transcribeJobs = allJobsInTask.filter((j) => j.payload.kind === "transcribe");

  // We must be in the trascribe phase
  if (transcribeJobs.length != 0) {
    const notFinishedTranscribeJobs = transcribeJobs.filter((j) => j.status.kind !== "finished");
    if (notFinishedTranscribeJobs.length != 0) {
      console.log(
        `Task ${taskId} still has ${notFinishedTranscribeJobs.length} transcribe jobs to finish`,
      );
      return;
    }

    // All transcribes done, we can combine the results
    console.log(
      `All transcribe jobs done for task ${taskId}, combining results and finishing task..`,
    );

    const results = transcribeJobs.map((j) => {
      if (j.payload.kind != "transcribe") throw new Error("Job must be a transcribe job");
      return ensure(j.payload.transcribedResult);
    });

    await ctx.db.patch(taskId, {
      status: {
        kind: "finished",
        result: {
          segments: results.flatMap((j) => j.segments),
          text: results.map((j) => j.text).join("\n"),
        },
      },
    });
  }
  // We are in the chunking phase
  else {
    const notFinishedChunkingJobs = chunkingJobs.filter((j) => j.status.kind !== "finished");
    if (notFinishedChunkingJobs.length != 0) {
      console.log(
        `Task ${taskId} still has ${notFinishedChunkingJobs.length} chunking jobs to finish`,
      );
      return;
    }

    console.log(`All chunking jobs done for task ${taskId}, starting transcribes for each chunk..`);
    await ctx.db.patch(taskId, {
      status: {
        kind: "transcribing",
      },
    });

    // Lets kick off a transcribe for each chunk
    for (const chunkingJob of chunkingJobs) {
      if (chunkingJob.payload.kind != "chunk") continue;
      for (const chunkStorageId of chunkingJob.payload.resultingChunkStorageIds) {
        await ctx.db.insert("jobs", {
          partOfTaskId: taskId,
          payload: {
            kind: "transcribe",
            inputAudioStorageId: chunkStorageId,
            inputAudioUrl: ensure(
              await ctx.storage.getUrl(chunkStorageId),
              `couldnt generate url for ${chunkStorageId}`,
            ),
          },
          status: {
            kind: "pending",
          },
        });
      }
    }

    await ctx.scheduler.runAfter(0, internal.workers.checkAndStartWorkersIfNeeded, {});
  }
};
