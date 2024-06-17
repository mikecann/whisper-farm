import { describe, expect, it } from "vitest";
import { v } from "convex/values";
import { validateValidator, validateValidatorJson } from "./validation";

describe("validateValidator", () => {
  it("works for a simple string", () => {
    const validator = v.string();
    validateValidator(validator, "hello");
    expect(() => validateValidator(validator, 123)).toThrow(
      "Validator error: Expected `string`, got `123`",
    );
  });

  it("works for a complex object", () => {
    const validator = v.object({
      a: v.string(),
      b: v.number(),
    });
    validateValidator(validator, { a: "aaa", b: 123 });
    expect(() => validateValidator(validator, { a: "aaa", b: "bbb" })).toThrow(
      "Validator error: Expected `number`, got `bbb`",
    );
  });

  it("works for an array", () => {
    const validator = v.array(
      v.object({
        a: v.boolean(),
      }),
    );
    validateValidator(validator, [{ a: true }, { a: false }]);
    expect(() => validateValidator(validator, [{ a: "true" }])).toThrow(
      "Validator error: Expected `boolean`, got `true`",
    );
  });
});
