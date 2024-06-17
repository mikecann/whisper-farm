import { describe, expect, it } from "vitest";
import { sliceAudioAndOutputFiles, sliceAudioBuffers } from "@worker/audio.ts";
import { readFile, remove } from "fs-extra";
import { readdir } from "fs/promises";

describe(`audioToSlice`, () => {
  it(`works`, async () => {
    const inputBuffer = await readFile("./example/sn0976-clip.mp3");
    const outputBuffers = await sliceAudioBuffers({ buffer: inputBuffer, seconds: 5 });
    expect(outputBuffers.length).toBe(15);

    const outputBuffers2 = await sliceAudioBuffers({ buffer: inputBuffer, seconds: 10 });
    expect(outputBuffers2.length).toBe(8);
  });
});

describe(`sliceAudioAndOutputFiles`, () => {
  it(`works`, async () => {
    const outputDirectoryPath = `./test-tmp`;
    await remove(outputDirectoryPath);

    await sliceAudioAndOutputFiles({
      outputDirectoryPath: `./test-tmp`,
      inputFilePath: "./example/sn0976-clip.mp3",
      chunkSizeSeconds: 10,
    });

    // Check the number of files in the output directory
    const files = await readdir(`./test-tmp`);
    expect(files.length).toBe(8);

    await remove(outputDirectoryPath);
  });
});
