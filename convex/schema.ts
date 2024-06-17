import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { transcriptionResultValidator } from "../shared/whisper";

export default defineSchema({
  workers: defineTable({
    status: v.union(
      v.object({
        kind: v.literal("stopped"),
      }),
      v.object({
        kind: v.literal("starting"),
      }),
      v.object({
        kind: v.literal("running"),
      }),
    ),
    deletedAt: v.optional(v.number()),
    machineId: v.optional(v.string()),
  })
    .index("by_deletedAt", ["deletedAt"])
    .index("by_machineId", ["machineId"]),

  tasks: defineTable({
    inputAudioStorageId: v.id("_storage"),
    deletedAt: v.optional(v.number()),
    status: v.union(
      v.object({
        kind: v.literal("not_started"),
      }),
      v.object({
        kind: v.literal("chunking"),
      }),
      v.object({
        kind: v.literal("transcribing"),
      }),
      v.object({
        kind: v.literal("finished"),
        result: transcriptionResultValidator,
      }),
    ),
  }).index("by_deletedAt", ["deletedAt"]),

  jobs: defineTable({
    partOfTaskId: v.id("tasks"),
    payload: v.union(
      v.object({
        kind: v.literal("chunk"),
        inputAudioStorageId: v.id("_storage"),
        inputAudioUrl: v.string(),
        resultingChunkStorageIds: v.array(v.id("_storage")),
        chunkLengthSeconds: v.number(),
      }),
      v.object({
        kind: v.literal("transcribe"),
        inputAudioStorageId: v.id("_storage"),
        inputAudioUrl: v.string(),
        transcribedResult: v.optional(transcriptionResultValidator),
      }),
    ),
    status: v.union(
      v.object({
        kind: v.literal("pending"),
      }),
      v.object({
        kind: v.literal("in_progress"),
        startedAt: v.number(),
        claimedByWorkerId: v.id("workers"),
      }),
      v.object({
        kind: v.literal("finished"),
      }),
    ),
  })
    .index("by_status_kind", ["status.kind"])
    .index("by_partOfTaskId", ["partOfTaskId"]),
});
