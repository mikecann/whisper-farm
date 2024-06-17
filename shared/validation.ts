import { JSONValue, Validator } from "convex/values";

type ObjectFieldType = { fieldType: ValidatorJSON; optional: boolean };

type ValidatorJSON =
  | {
      type: "null";
    }
  | { type: "number" }
  | { type: "bigint" }
  | { type: "boolean" }
  | { type: "string" }
  | { type: "bytes" }
  | { type: "any" }
  | {
      type: "literal";
      value: JSONValue;
    }
  | { type: "id"; tableName: string }
  | { type: "array"; value: ValidatorJSON }
  | { type: "object"; value: Record<string, ObjectFieldType> }
  | { type: "union"; value: ValidatorJSON[] };

function tableNameFromId(id: string) {
  const parts = id.split(";");
  if (parts.length !== 2) {
    return null;
  }
  return id.split(";")[1];
}

function isSimpleObject(value: unknown) {
  const isObject = typeof value === "object";
  const prototype = Object.getPrototypeOf(value);
  const isSimple =
    prototype === null ||
    prototype === Object.prototype ||
    // Objects generated from other contexts (e.g. across Node.js `vm` modules) will not satisfy the previous
    // conditions but are still simple objects.
    prototype?.constructor?.name === "Object";
  return isObject && isSimple;
}

export function validateValidator<T>(validator: Validator<T, any, any>, value: any): T {
  const validatorJson = (validator as any).json as ValidatorJSON;

  if (validatorJson == undefined)
    throw new Error(`Passed validator is missing the internal 'json' property.`);

  validateValidatorJson(validatorJson, value);

  return value;
}

/// Borrowed from: https://github.com/get-convex/convex-test/blob/main/index.ts#L792
export function validateValidatorJson(validatorJson: ValidatorJSON, value: any) {
  switch (validatorJson.type) {
    case "null": {
      if (value !== null) {
        throw new Error(`Validator error: Expected \`null\`, got \`${value}\``);
      }
      return;
    }
    case "number": {
      if (typeof value !== "number") {
        throw new Error(`Validator error: Expected \`number\`, got \`${value}\``);
      }
      return;
    }
    case "bigint": {
      if (typeof value !== "bigint") {
        throw new Error(`Validator error: Expected \`bigint\`, got \`${value}\``);
      }
      return;
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        throw new Error(`Validator error: Expected \`boolean\`, got \`${value}\``);
      }
      return;
    }
    case "string": {
      if (typeof value !== "string") {
        throw new Error(`Validator error: Expected \`string\`, got \`${value}\``);
      }
      return;
    }
    case "bytes": {
      if (!(value instanceof ArrayBuffer)) {
        throw new Error(`Validator error: Expected \`ArrayBuffer\`, got \`${value}\``);
      }
      return;
    }
    case "any": {
      return;
    }
    case "literal": {
      if (value !== validatorJson.value) {
        throw new Error(
          `Validator error: Expected \`${validatorJson.value as any}\`, got \`${value}\``,
        );
      }
      return;
    }
    case "id": {
      if (typeof value !== "string") {
        throw new Error(`Validator error: Expected \`string\`, got \`${value}\``);
      }
      if (tableNameFromId(value) !== validatorJson.tableName) {
        throw new Error(
          `Validator error: Expected ID for table "${validatorJson.tableName}", got \`${value}\``,
        );
      }
      return;
    }
    case "array": {
      if (!Array.isArray(value)) {
        throw new Error(`Validator error: Expected \`Array\`, got \`${value}\``);
      }
      for (const v of value) {
        validateValidatorJson(validatorJson.value, v);
      }
      return;
    }
    case "object": {
      if (typeof value !== "object") {
        throw new Error(`Validator error: Expected \`object\`, got \`${value}\``);
      }
      if (!isSimpleObject(value)) {
        throw new Error(
          `Validator error: Expected a plain old JavaScript \`object\`, got \`${value}\``,
        );
      }
      for (const [k, { fieldType, optional }] of Object.entries(validatorJson.value)) {
        if (value[k] === undefined) {
          if (!optional) {
            throw new Error(`Validator error: Missing required field \`${k}\` in object`);
          }
        } else {
          validateValidatorJson(fieldType, value[k]);
        }
      }
      for (const k of Object.keys(value)) {
        if (validatorJson.value[k] === undefined) {
          throw new Error(`Validator error: Unexpected field \`${k}\` in object`);
        }
      }
      return;
    }
  }
}
