import { v } from "convex/values";

export const transcriptionResultValidator = v.object({
  segments: v.array(
    v.object({
      id: v.number(),
      seek: v.number(),
      start: v.number(),
      end: v.number(),
      text: v.string(),
      tokens: v.array(v.number()),
      temperature: v.number(),
      avg_logprob: v.number(),
      compression_ratio: v.number(),
      no_speech_prob: v.number(),
      words: v.array(
        v.object({
          start: v.number(),
          end: v.number(),
          word: v.string(),
          probability: v.number(),
        }),
      ),
    }),
  ),
  text: v.string(),
});

export type TranscriptionResult = typeof transcriptionResultValidator.type;
