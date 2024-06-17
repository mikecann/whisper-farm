import { $ } from "bun";
import { parse, format } from "path";
import fs from "fs";
import { validateValidator } from "@shared/validation.ts";
import { TranscriptionResult, transcriptionResultValidator } from "@shared/whisper.ts";

export const transcribe = async ({
  inputAudioFilePath,
}: {
  inputAudioFilePath: string;
}): Promise<TranscriptionResult> => {
  const parsed = parse(inputAudioFilePath);

  // Transcribe
  console.log(`Transcribing ${inputAudioFilePath}...`);
  await $`whisper-faster-xxl ${inputAudioFilePath} --output_format json --language en --output_dir ${parsed.dir} --beep_off`;

  const jsonFilePath = format({
    dir: parsed.dir,
    name: parsed.name,
    ext: ".json",
  });

  // Grab the result
  console.log(`Transcription complete, reading output from ${jsonFilePath}`);
  const result = await Bun.file(jsonFilePath).json();

  // Lets tidy up after ourself
  fs.unlinkSync(jsonFilePath);

  return validateValidator(transcriptionResultValidator, result);
};
