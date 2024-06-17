import { internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { createClient } from "../server/fly/main";
import { ensure } from "../shared/ensure";
import { iife } from "../shared/misc";
import { checkAndStartWorkersIfNeeded } from "./workers";

export const listTasks = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("tasks")
      .withIndex("by_deletedAt", (q) => q.eq("deletedAt", undefined))
      .order("desc")
      .take(100);
  },
});

export const findTask = query({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const destroyTask = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const createTask = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", {
      inputAudioStorageId: args.storageId,
      status: {
        kind: "not_started",
      },
    });
  },
});

export const startTask = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (task == null) throw new Error("Task not found");
    if (task.deletedAt != null) throw new Error("Task destroyed");
    if (task.status.kind != "not_started") throw new Error("Task must be not_started to start it");

    await ctx.db.patch(args.id, {
      status: {
        kind: "chunking",
      },
    });

    await ctx.db.insert("jobs", {
      partOfTaskId: task._id,
      status: {
        kind: "pending",
      },
      payload: {
        kind: "chunk",
        inputAudioStorageId: task.inputAudioStorageId,
        inputAudioUrl: ensure(
          await ctx.storage.getUrl(task.inputAudioStorageId),
          `couldnt generate url for ${task.inputAudioStorageId}`,
        ),
        resultingChunkStorageIds: [],
        chunkLengthSeconds: 30,
      },
    });

    await ctx.scheduler.runAfter(0, internal.workers.checkAndStartWorkersIfNeeded, {});
  },
});

// export const chunked = mutation({
//   args: {
//     id: v.id("tasks"),
//     chunks: v.array(v.object({ storageId: v.id("_storage") })),
//   },
//   handler: async (ctx, args) => {
//     const task = await ctx.db.get(args.id);
//     if (task == null) throw new Error("Task not found");
//     if (task.deletedAt != null) throw new Error("Task destroyed");
//     if (task.status.kind != "chunking") throw new Error("Task must be starting_chunking");
//
//     if (args.chunks.length != 1) throw new Error("Only handling one chunk right now");
//
//     const chunk = ensure(args.chunks[0]);
//
//     await ctx.db.patch(args.id, {
//       status: {
//         kind: "chunked",
//       },
//     });
//
//     await ctx.db.insert("jobs", {
//       partOfTaskId: task._id,
//       status: {
//         kind: "pending",
//       },
//       payload: {
//         kind: "transcribe",
//         inputAudioStorageId: chunk.storageId,
//         inputAudioUrl: ensure(
//           await ctx.storage.getUrl(chunk.storageId),
//           `couldnt generate url for ${chunk.storageId}`,
//         ),
//       },
//     });
//   },
// });

// export const startChunking = internalAction({
//   args: {
//     id: v.id("tasks"),
//   },
//   handler: async (ctx, args) => {
//     const task = await ctx.runQuery(api.tasks.findTask, { id: args.id });
//     if (task == null) throw new Error("Worker not found");
//     if (task.deletedAt != null) throw new Error("Worker destroyed");
//     if (task.status.kind != "starting_chunking")
//       throw new Error("Worker must not be starting_chunking");
//
//     await ctx.runMutation(api.tasks.chunked, {
//       id: args.id,
//       chunks: [{ storageId: task.inputAudioStorageId }],
//     });
//   },
// });
