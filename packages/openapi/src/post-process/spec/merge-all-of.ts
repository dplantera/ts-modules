/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */

import { OpenApiBundled } from "../../bundle.js";
import { oas30 } from "openapi3-ts";
import { _ } from "@dsp/node-sdk";

import { cleanObj, SpecResolver } from "../spec-resolver.js";
import jsonSchemaMergeAllOff from "json-schema-merge-allof";

export function mergeAllOf(bundled: OpenApiBundled) {
  const mergedAllOf = _.cloneDeep(bundled);
  const { collected, ctx } = findSchemaObjectsWithAllOf(mergedAllOf);
  collected.forEach((s, idx, array) => doMerge(s, ctx));
  return mergedAllOf;
}

function doMerge(schema: any, ctx: SpecResolver.Context) {
  const subSchemas: Array<oas30.ReferenceObject | oas30.SchemaObject> = schema.allOf ?? [];

  const clonedSchemas = _.cloneDeep(subSchemas);
  const _resolvedSchemas = resolveSubSchemas(clonedSchemas, ctx);
  // include dangling properties {allOf: [], danglingA: {}, danglingB: [], danglingC: null, ... }
  const danglingProperties = { ..._.omit(schema, "allOf") };
  if (!_.isEmpty(danglingProperties)) {
    _resolvedSchemas.push({ pointer: undefined, resolved: danglingProperties });
  }
  const hasOneOfOrAnyOf = _resolvedSchemas.filter((f) => !_.isEmpty(f.resolved.oneOf) || !_.isEmpty(f.resolved.anyOf))?.length > 0;
  if (hasOneOfOrAnyOf) {
    throw `Error: anyOf or oneOf are yet not supported as an allOf subschema: ${JSON.stringify(schema)}`;
  }

  const parentsWithDiscriminator = _resolvedSchemas.filter((p) => _.isDefined(p.pointer) && _.isDefined(p.resolved.discriminator));
  const resolvedSchemas = _resolvedSchemas.filter((p) => !(_.isDefined(p.pointer) && _.isDefined(p.resolved.discriminator)));

  if (resolvedSchemas.length < 1) {
    // something is off: could be a schema with a single allOf or an allOf comprised of multiple discriminators...
    return schema;
  }

  if (parentsWithDiscriminator.length == 1 && resolvedSchemas.length == 1) {
    // we may have an allOf expressing inheritance - most tooling can handle two allOfs
    return schema;
  }
  if (parentsWithDiscriminator.length == 1 && resolvedSchemas.length > 1) {
    const merged = mergeSubSchemas(resolvedSchemas, ctx);
    // build hierarchy
    const hierarchy = parentsWithDiscriminator.reduce((acc, curr) => {
      return { allOf: [{ $ref: curr.pointer }, acc] };
    }, merged.resolved);
    delete schema["$ref"];
    Object.assign(schema, hierarchy);
    return schema;
  }

  if (parentsWithDiscriminator.length > 1) {
    const merged = mergeSubSchemas(resolvedSchemas, ctx);
    // build hierarchy
    const hierarchy = parentsWithDiscriminator.reduce((acc, curr) => {
      return { allOf: [{ $ref: curr.pointer }, acc] };
    }, merged.resolved);
    delete schema["$ref"];
    Object.assign(schema, hierarchy);
    return schema;
  }

  if (parentsWithDiscriminator.length < 1) {
    // we only have schemas which we can merge together
    const merged = mergeSubSchemas(resolvedSchemas, ctx);
    Object.assign(schema, merged.resolved);
    delete schema["allOf"];
    delete schema["$ref"];
    return schema;
  }

  throw "Error: should not have been reached";
}

function resolveSubSchemas(
  subSchemas: Array<oas30.ReferenceObject | oas30.SchemaObject>,
  ctx: SpecResolver.Context
): Array<{ pointer: string | undefined; resolved: oas30.SchemaObject & { $ref?: string } }> {
  const subs = subSchemas.map((d) => {
    return SpecResolver.resolveRefNode(d, ctx, { deleteRef: true });
  });
  const allOfs = subs.flatMap((s) => s.resolved.allOf ?? []);
  if (_.isEmpty(allOfs)) {
    return subs;
  }
  const flatten = resolveSubSchemas(allOfs, ctx);
  return [...flatten, ...subs].map((s) => ({ pointer: s.pointer, resolved: _.omit(s.resolved, "allOf") }));
}

function getJsonSchemaMergeAllOff(subschemas: Array<{ pointer: string | undefined; resolved: oas30.SchemaObject }>) {
  return jsonSchemaMergeAllOff(
    { allOf: subschemas.map((s) => s.resolved) },
    {
      resolvers: {
        // overwrite title by higher indexed schema: [ {title: a}, {title:b}] => {title:b}
        title: ([a, b]) => b ?? a!,
      },
    }
  );
}

function mergeSubSchemas(_resolvedSchemas: Array<{ pointer: string | undefined; resolved: oas30.SchemaObject }>, ctx: SpecResolver.Context) {
  const subschemas = _resolvedSchemas.map((d) => ({
    pointer: d.pointer,
    resolved: SpecResolver.resolveRef(d.resolved, ctx, { deleteRef: true }),
  }));

  const merged = getJsonSchemaMergeAllOff(subschemas);
  // clean references in properties
  Object.values(merged.properties ?? {}).forEach((propValue) => {
    if (_.isNil(propValue.$ref) || _.isEmpty(_.omit(propValue, "$ref"))) {
      // property is either a ref or an object => that is fine
      return;
    }
    // we have both a ref and an object. We try to keep the ref, if the content is identical
    const schema = { pointer: undefined, resolved: _.cloneDeep(_.omit(propValue, "$ref")) };
    const referenced = SpecResolver.resolveRefNode(propValue, ctx, { deleteRef: false });
    if (_.isEqual(schema.resolved, referenced.resolved)) {
      cleanObj(propValue, []);
      Object.assign(propValue, { $ref: referenced.pointer });
      return;
    }
    Object.assign(propValue, getJsonSchemaMergeAllOff([schema, referenced]));
    delete propValue["$ref"];
  });
  return {
    pointer: undefined,
    resolved: merged,
  };
}

function findSchemaObjectsWithAllOf(bundled: OpenApiBundled) {
  return SpecResolver.findSchemaObjectsWith(bundled, (node) => _.isDefined(node.allOf));
}
