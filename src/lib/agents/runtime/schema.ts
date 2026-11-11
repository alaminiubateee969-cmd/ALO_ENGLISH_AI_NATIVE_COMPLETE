/**
 * src/lib/agents/runtime/schema.ts
 *
 * A small JSON-Schema checker.
 *
 * WHY NOT AJV
 * ───────────
 * The agent contracts are deliberately small: objects, strings, numbers,
 * booleans, arrays, enums, required properties, and a couple of bounds. That
 * is the whole vocabulary. Pulling a full JSON-Schema implementation in for
 * it would add a dependency to every request the platform serves, for a
 * feature that is used on background jobs only.
 *
 * What is supported: type, required, properties, additionalProperties,
 * items, enum, minimum, maximum, minLength, maxLength, minItems, maxItems,
 * pattern, and `anyOf` with null (for optional values).
 *
 * What is not: $ref, oneOf, allOf, if/then, format, patternProperties,
 * dependentSchemas. A schema that uses one of those is rejected loudly at
 * registration time rather than silently half-checked.
 */

import type { SchemaViolation } from "./types";

type JsonSchema = Record<string, unknown>;

const SUPPORTED_KEYS = new Set([
  "type",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "enum",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "pattern",
  "anyOf",
  "description",
  "title",
  "default",
  "examples",
]);

/** Throws when a schema uses a keyword this checker does not implement. */
export function assertSupportedSchema(schema: JsonSchema, where: string): void {
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_KEYS.has(key)) {
      throw new Error(
        `${where}: unsupported JSON Schema keyword "${key}". ` +
          `Supported: ${[...SUPPORTED_KEYS].join(", ")}.`,
      );
    }
  }
  const props = schema.properties;
  if (props && typeof props === "object") {
    for (const [name, sub] of Object.entries(props as Record<string, JsonSchema>)) {
      if (sub && typeof sub === "object") {
        assertSupportedSchema(sub, `${where}.${name}`);
      }
    }
  }
  const items = schema.items;
  if (items && typeof items === "object") {
    assertSupportedSchema(items as JsonSchema, `${where}[]`);
  }
  const anyOf = schema.anyOf;
  if (Array.isArray(anyOf)) {
    for (const sub of anyOf) {
      if (sub && typeof sub === "object") {
        assertSupportedSchema(sub as JsonSchema, `${where}|`);
      }
    }
  }
}

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function matchesType(value: unknown, expected: string): boolean {
  switch (expected) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "null":
      return value === null;
    default:
      return false;
  }
}

function checkValue(
  value: unknown,
  schema: JsonSchema,
  path: string,
  violations: SchemaViolation[],
): void {
  if (Array.isArray(schema.anyOf)) {
    const branches = schema.anyOf as JsonSchema[];
    const ok = branches.some((branch) => {
      const local: SchemaViolation[] = [];
      checkValue(value, branch, path, local);
      return local.length === 0;
    });
    if (!ok) {
      violations.push({ path, message: "did not match any allowed type" });
      return;
    }
    // A nullable value is valid; otherwise check the first non-null branch.
    const firstMatch = branches.find((branch) => {
      const local: SchemaViolation[] = [];
      checkValue(value, branch, path, local);
      return local.length === 0;
    });
    if (firstMatch) {
      checkValue(value, firstMatch, path, violations);
    }
    return;
  }

  if (schema.type !== undefined) {
    const expected = Array.isArray(schema.type) ? (schema.type as string[]) : [String(schema.type)];
    if (!expected.some((t) => matchesType(value, t))) {
      violations.push({
        path,
        message: `expected ${expected.join(" or ")} but got ${typeOf(value)}`,
      });
      return;
    }
  }

  if (Array.isArray(schema.enum)) {
    if (!schema.enum.includes(value as never)) {
      violations.push({
        path,
        message: `expected one of ${JSON.stringify(schema.enum)}`,
      });
    }
  }

  if (typeof value === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      violations.push({ path, message: `shorter than minLength ${schema.minLength}` });
    }
    if (typeof schema.maxLength === "number" && value.length > schema.maxLength) {
      violations.push({ path, message: `longer than maxLength ${schema.maxLength}` });
    }
    if (typeof schema.pattern === "string") {
      let re: RegExp;
      try {
        re = new RegExp(schema.pattern);
      } catch {
        violations.push({ path, message: "schema pattern is not a valid regular expression" });
        return;
      }
      if (!re.test(value)) {
        violations.push({ path, message: `did not match pattern ${schema.pattern}` });
      }
    }
  }

  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) {
      violations.push({ path, message: `below minimum ${schema.minimum}` });
    }
    if (typeof schema.maximum === "number" && value > schema.maximum) {
      violations.push({ path, message: `above maximum ${schema.maximum}` });
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      violations.push({ path, message: `fewer than minItems ${schema.minItems}` });
    }
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      violations.push({ path, message: `more than maxItems ${schema.maxItems}` });
    }
    const itemSchema = schema.items;
    if (itemSchema && typeof itemSchema === "object") {
      value.forEach((item, index) => {
        checkValue(item, itemSchema as JsonSchema, `${path}[${index}]`, violations);
      });
    }
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
    for (const key of required) {
      if (!(key in record) || record[key] === undefined) {
        violations.push({ path: `${path}.${key}`, message: "is required" });
      }
    }
    const properties =
      schema.properties && typeof schema.properties === "object"
        ? (schema.properties as Record<string, JsonSchema>)
        : {};
    for (const [key, sub] of Object.entries(properties)) {
      if (key in record && record[key] !== undefined) {
        checkValue(record[key], sub, `${path}.${key}`, violations);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(record)) {
        if (!(key in properties)) {
          violations.push({ path: `${path}.${key}`, message: "is not an allowed property" });
        }
      }
    }
  }
}

/**
 * Validate a value against a schema.
 * @returns the list of violations; an empty list means the value is valid.
 */
export function validateAgainstSchema(
  value: unknown,
  schema: JsonSchema,
  path = "$",
): SchemaViolation[] {
  const violations: SchemaViolation[] = [];
  checkValue(value, schema, path, violations);
  return violations;
}

/** True when the value satisfies the schema. */
export function isValidAgainstSchema(value: unknown, schema: JsonSchema): boolean {
  return validateAgainstSchema(value, schema).length === 0;
}
