/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { OpenApiBundled } from "../bundle.js";
import { oas30 } from "openapi3-ts";
import _ from "lodash";
import { z, ZodString } from "zod";
import pointer from "jsonpointer";
import { TopologicalSort } from "topological-sort";
import { isRef } from "@redocly/openapi-core";
// noinspection TypeScriptCheckImport
// eslint-disable-next-line
// @ts-ignore
import mergeJsonSchemas from "merge-json-schemas";

type Node = oas30.SchemaObject | undefined | { [key: string]: Node };
type Context = {
  root: OpenApiBundled;
  visited: Map<string, Node>;
  nodes: Map<Node, Node>;
  edges: Map<Node, Array<Node>>;
  path: { all: Array<Array<string>>; current: Array<string> };
};

export function mergeAllOf(bundled: OpenApiBundled) {
  const mergedAllOf = _.cloneDeep(bundled);
  const { collected, ctx } = findSchemaObjectsWithAllOf(mergedAllOf);
  collected.forEach((s) => doMerge(s, ctx));
  return mergedAllOf;
}
function doMerge(schema: any, ctx: Context) {
  const subSchemas: Array<oas30.ReferenceObject | oas30.SchemaObject> =
    schema.allOf ?? [];

  const clonedSchemas = _.cloneDeep(subSchemas);
  const resolvedSchemas = clonedSchemas.map((d) =>
    resolveRef(d, ctx, { deleteRef: false })
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
  ctx: Context
) {
  const firstSchema = _resolvedSchemas[0];
  const subschemas = _resolvedSchemas
    .slice(1)
    .map((d) => resolveRef(d, ctx, { deleteRef: true }));

  const merged = subschemas.reduce((acc, curr) => {
    const merged = mergeJsonSchemas([acc, curr]);
    return Object.assign(acc, merged);
  }, firstSchema);
  return merged;
}

function findSchemaObjectsWithAllOf(bundled: OpenApiBundled) {
  const visited = new Map();
  const nodes = new Map();
  const edges = new Map();
  const path = {
    all: <Array<Array<string>>>[],
    current: <Array<string>>[],
  };
  collectAllOfDsp(bundled, undefined, {
    root: bundled,
    visited,
    nodes,
    path,
    edges,
  });
  const sorted = topoSort(edges);
  const collected = [];
  sorted.forEach((s) => {
    if (!nodes.has(s)) {
      return;
    }
    collected.push(nodes.get(s));
    nodes.delete(s);
  });
  collected.push(...nodes.keys());
  return {
    collected,
    ctx: {
      root: bundled,
      visited,
      nodes,
      path,
      edges,
    },
  };
}

function collectAllOfDsp(node: Node, parent: Node | undefined, ctx: Context) {
  if (
    _.isEmpty(node) ||
    typeof node !== "object" ||
    ctx.visited.has(toNodeId(ctx.path.current))
  ) {
    // leaf
    ctx.path.all.push(_.cloneDeep(ctx.path.current));
    return ctx;
  }
  ctx.visited.set(toNodeId(ctx.path.current), node);

  const key = ctx.path.current.at(-1);
  if (!_.isNil(parent) && _.isNil(key)) {
    return ctx;
  }

  for (const [key, value] of Object.entries(node)) {
    const next: Node = value;
    const nextPath = [...ctx.path.current, key];
    const newParent = isSchema(node) ? node : parent;
    collectAllOfDsp(next, newParent, {
      ...ctx,
      path: { ...ctx.path, current: nextPath },
    });
  }
  const refObj = parseRefObj(node);
  if (refObj.success) {
    const resolved = resolveRef(refObj.data, ctx);
    const children = ctx.edges.get(parent) ?? [];
    children.push(resolved);
    ctx.edges.set(parent, children);
  }

  if (isSchema(node) && !ctx.nodes.has(node)) {
    const children = ctx.edges.get(parent) ?? [];
    children.push(node);
    ctx.edges.set(parent ?? ctx.root, children);

    // collect
    if (node.allOf) {
      ctx.nodes.set(node, node);
    }
  }

  return ctx;
}

function toNodeId(path: Array<string>) {
  return path.join("::");
}

function resolveRef(
  data: { $ref: string } | unknown,
  ctx: Context,
  params?: { deleteRef: boolean }
): typeof params extends { deletedRef: true }
  ? oas30.SchemaObject
  : oas30.SchemaObject & { $ref?: string } {
  if (!isRef(data)) {
    return data as oas30.SchemaObject;
  }
  const ref = data.$ref;
  try {
    const propPath = ref.replace("#/", "/");
    if (params?.deleteRef ?? false) {
      delete (data as any).$ref;
    }
    return pointer.get(ctx.root, propPath);
  } catch {
    throw `Error: could not resolve ref ${ref} in: ${ctx.path.current.join(
      "/"
    )}`;
  }
}

const SchemaObject = z.object({
  discriminator: z.record(z.any()).optional(),
  type: z
    .enum(["integer", "number", "string", "boolean", "object", "null", "array"])
    .optional(),
  allOf: z.array(z.any()).optional(),
  oneOf: z.array(z.any()).optional(),
  anyOf: z.array(z.any()).optional(),
  items: z.record(z.any()).optional(),
  properties: z.record(z.any()).optional(),
});

function isSchema(node: Node) {
  const parsed = SchemaObject.safeParse(node);
  return parsed.success && !_.isEmpty(parsed.data);
}

function parseRefObj(node: unknown) {
  return z.object({ $ref: z.string() }).safeParse(node);
}

function topoSort(edges: Map<Node, Array<Node>>) {
  try {
    const nodes = new Map();
    Array.from(edges.keys()).forEach((parent) => {
      if (parent && !nodes.has(parent)) {
        nodes.set(parent, parent);
      }
    });
    Array.from(edges.values()).forEach((children) => {
      children.forEach((c) => {
        if (c && !nodes.has(c)) {
          nodes.set(c, c);
        }
      });
    });

    const sortOp = new TopologicalSort(nodes);

    for (const [parent, children] of edges.entries()) {
      if (!parent) {
        continue;
      }
      const set = new Set(children);
      Array.from(set).forEach((v) => {
        if (!v) {
          return;
        }
        sortOp.addEdge(parent, v);
      });
    }
    return Array.from(sortOp.sort().keys()).reverse();
  } catch (e) {
    throw "Error: could not create dependency graph";
  }
}
