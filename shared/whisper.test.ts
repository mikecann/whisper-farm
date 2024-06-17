import { it } from "vitest";
import { TranscriptionResult, transcriptionResultValidator } from "@shared/whisper.ts";
import { validateValidator, validateValidatorJson } from "@shared/validation.ts";

const fixture: TranscriptionResult = {
  segments: [
    {
      id: 1,
      seek: 129,
      start: 0,
      end: 1.26,
      text: " It's time for security now, Steve.",
      tokens: [50364, 467, 311, 565, 337, 3825, 586, 11, 7466, 13, 50429],
      temperature: 0,
      avg_logprob: -0.3808593874176343,
      compression_ratio: 0.8095238095238095,
      no_speech_prob: 0.397216796875,
      words: [
        {
          start: 0,
          end: 0.42,
          word: " It's",
          probability: 0.82958984375,
        },
        {
          start: 0.42,
          end: 0.44,
          word: " time",
          probability: 0.994140625,
        },
        {
          start: 0.44,
          end: 0.68,
          word: " for",
          probability: 0.99609375,
        },
        {
          start: 0.68,
          end: 0.94,
          word: " security",
          probability: 0.646484375,
        },
        {
          start: 0.94,
          end: 1.16,
          word: " now,",
          probability: 0.88134765625,
        },
        {
          start: 1.26,
          end: 1.26,
          word: " Steve.",
          probability: 0.92919921875,
        },
      ],
    },
  ],
  text: " It's time for security now, Steve.",
};

it(`works`, () => {
  validateValidator(transcriptionResultValidator, fixture);
});
