/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { OpenApiBundled } from "../bundle.js";
import { oas30 } from "openapi3-ts";
import _ from "lodash";
import { z, ZodString } from "zod";
import pointer from "jsonpointer";
import { TopologicalSort } from "topological-sort";
import { isRef } from "@redocly/openapi-core";

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
  const merged = mergeSubSchemas(subSchemas, ctx);

  Object.assign(schema, merged);
  delete schema.allOf;
}

function mergeSubSchemas(
  subSchemas: Array<oas30.ReferenceObject | oas30.SchemaObject>,
  ctx: Context
) {
  const clonedSchemas = _.cloneDeep(subSchemas);
  const firstSchema = resolveRef(clonedSchemas[0], ctx);

  // todo: handle merge
  return clonedSchemas
    .slice(1)
    .map((d) => resolveRef(d, ctx))
    .reduce((acc, curr) => {
      return Object.assign(acc, curr);
    }, firstSchema);
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
  ctx: Context
): oas30.SchemaObject {
  if (!isRef(data)) {
    return data as oas30.SchemaObject;
  }
  try {
    const propPath = data.$ref.replace("#/", "/");
    return pointer.get(ctx.root, propPath);
  } catch {
    throw `Error: could not resolve ref ${
      data.$ref
    } in: ${ctx.path.current.join("/")}`;
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
