/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenApiBundled } from "../bundle.js";
import { oas30 } from "openapi3-ts";
import { _ } from "@dsp/node-sdk";
// noinspection TypeScriptCheckImport
// eslint-disable-next-line
// @ts-ignore
import mergeJsonSchemas from "merge-json-schemas";
import { SpecResolver } from "./spec-resolver.js";

export function mergeAllOf(bundled: OpenApiBundled) {
  const mergedAllOf = _.cloneDeep(bundled);
  const { collected, ctx } = findSchemaObjectsWithAllOf(mergedAllOf);
  collected.forEach((s) => doMerge(s, ctx));
  return mergedAllOf;
}
function doMerge(schema: any, ctx: SpecResolver.Context) {
  const subSchemas: Array<oas30.ReferenceObject | oas30.SchemaObject> =
    schema.allOf ?? [];

  const clonedSchemas = _.cloneDeep(subSchemas);
  const resolvedSchemas = clonedSchemas.map((d) =>
    SpecResolver.resolveRef(d, ctx, { deleteRef: false })
  );

  // include dangling properties {allOf: [], danglingA: {}, danglingB: [], danglingC: null, ... }
  const danglingProperties = { ..._.omit(schema, "allOf") };
  resolvedSchemas.unshift(danglingProperties);

  const discriminatedParent = _.cloneDeep(
    resolvedSchemas.toReversed().find((p) => !_.isNil(p.discriminator))
  );
  if (_.isDefined(discriminatedParent) && resolvedSchemas.length <= 2) {
    return schema;
  }

  const merged = mergeSubSchemas(resolvedSchemas, ctx);

  if (_.isDefined(discriminatedParent)) {
    // we set back the ref for parents so we have nice inheritance for java
    const parent = _.isDefined(discriminatedParent["$ref"])
      ? _.pick(discriminatedParent, "$ref")
      : discriminatedParent;
    delete merged["$ref"];
    delete merged.allOf;
    schema.allOf = [parent, merged];
    cleanObj(schema, ["allOf"]);
    return;
  }

  // { allOf: [a, b] } ==> {...a, ...b}
  Object.assign(schema, merged);
  delete schema.allOf;
  delete schema["$ref"];
}

function cleanObj<T extends Record<string, any>>(
  obj: T,
  except: Array<keyof T>
) {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (except.includes(prop)) {
      return;
    }
    delete obj[prop];
  });
}

function mergeSubSchemas(
  _resolvedSchemas: Array<oas30.SchemaObject>,
  ctx: SpecResolver.Context
) {
  const firstSchema = _resolvedSchemas[0];
  const subschemas = _resolvedSchemas
    .slice(1)
    .map((d) => SpecResolver.resolveRef(d, ctx, { deleteRef: true }));

  const merged = subschemas.reduce((acc, curr) => {
    const merged = mergeJsonSchemas([acc, curr]);
    return Object.assign(acc, merged);
  }, firstSchema);
  return merged;
}

function findSchemaObjectsWithAllOf(bundled: OpenApiBundled) {
  return SpecResolver.findSchemaObjectsWith(bundled, (node) =>
    _.isDefined(node.allOf)
  );
}
