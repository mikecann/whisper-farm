import { describe, expect, it } from "vitest";
import { remove } from "fs-extra";
import { sliceAudioAndOutputFiles } from "@worker/audio.ts";
import { readdir } from "fs/promises";
import { __dirname, storeFiles } from "@worker/files.ts";
import { ConvexClient } from "convex/browser";

describe(`storeFiles`, () => {
  it(
    `works`,
    async () => {
      const client = new ConvexClient(`https://basic-bird-794.convex.cloud`);
      const results = await storeFiles({
        client,
        filePaths: [
          `${__dirname}/../example/sn0976-clip-mini.mp3`,
          `${__dirname}/../example/sn0976-clip-mini.mp3`,
        ],
      });
      expect(results.length).toBe(2);
    },
    { timeout: 30000 },
  );
});
