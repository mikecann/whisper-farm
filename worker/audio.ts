import { writeFile, readdir, readFile, unlink } from "fs/promises";
import { unlinkSync } from "fs";
import { ensureDir, remove, removeSync } from "fs-extra";
import { join } from "path";
import { tmpdir } from "os";
import { exec } from "child_process";
import { promisify } from "util";
import ffmpeg from "@ffmpeg-installer/ffmpeg";

const execAsync = promisify(exec);

// Borrowed from: https://github.com/AliAryanTech/audio-slicer/blob/master/index.js#L7C1-L27C2
export const sliceAudioBuffers = async ({
  buffer,
  seconds,
}: {
  buffer: Buffer;
  seconds: number;
}): Promise<Buffer[]> => {
  const options = "-c:a libmp3lame";
  const filename = join(tmpdir(), `${Math.random().toString(36)}.mp3`);
  await writeFile(filename, buffer);

  const directory = "tmp";
  await ensureDir(directory);

  try {
    await execAsync(
      `${ffmpeg.path} -i ${filename} -f segment -segment_time ${seconds} ${options} ${directory}/document_%03d.mp3`,
    );
    const files = await readdir(directory);
    return Promise.all(files.map((file) => readFile(join(directory, file))));
  } catch (error: any) {
    console.error(`error slicing`, error);
    return [];
  } finally {
    unlinkSync(filename);
    removeSync(directory);
  }
};

// This wraps the above function but operates on files instead
export const sliceAudioAndOutputFiles = async ({
  chunkSizeSeconds = 10,
  outputDirectoryPath,
  inputFilePath,
}: {
  chunkSizeSeconds?: number;
  inputFilePath: string;
  outputDirectoryPath: string;
}) => {
  const inputBuffer = await readFile(inputFilePath);
  const outputBuffers = await sliceAudioBuffers({ buffer: inputBuffer, seconds: chunkSizeSeconds });

  await ensureDir(outputDirectoryPath);
  await Promise.all(
    outputBuffers.map((buffer, index) =>
      writeFile(join(outputDirectoryPath, `chunk_${index + 1}.mp3`), buffer),
    ),
  );

  console.log(`Sliced audio saved to ${outputDirectoryPath}`);
};
