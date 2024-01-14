/* eslint-disable no-inner-declarations,@typescript-eslint/no-explicit-any */
import { oas30 } from "openapi3-ts";
import { OpenApiBundled } from "../bundle.js";
import { isRef } from "@redocly/openapi-core";
import pointer from "jsonpointer";
import { z } from "zod";
import { TopologicalSort } from "topological-sort";
import { _ } from "@dsp/node-sdk";

export module SpecResolver {
  export type Node = oas30.SchemaObject | undefined | { [key: string]: Node };
  export type Context = {
    root: OpenApiBundled;
    visited: Map<string, Node>;
    nodes: Map<Node, Node>;
    edges: Map<Node, Array<Node>>;
    path: { all: Array<Array<string>>; current: Array<string> };
  };

  export type CollectCondition = (schema: oas30.SchemaObject) => boolean;
  export function findSchemaObjectsWith(
    bundled: OpenApiBundled,
    ...conditions: Array<CollectCondition>
  ) {
    /* CONTEXT */
    const visited = new Map();
    const nodes = new Map();
    const edges = new Map();
    const path = {
      all: <Array<Array<string>>>[],
      current: <Array<string>>[],
    };

    /* COLLECT */
    collectDFS(bundled, undefined, conditions, {
      root: bundled,
      visited,
      nodes,
      path,
      edges,
    });

    /* SORT by dependency */
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

  function collectDFS(
    node: Node,
    parent: Node | undefined,
    visitors: Array<CollectCondition>,
    ctx: Context
  ) {
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
      collectDFS(next, newParent, visitors, {
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
      if (visitors.some((collectCondition) => collectCondition(node))) {
        ctx.nodes.set(node, node);
      }
    }

    return ctx;
  }

  function toNodeId(path: Array<string>) {
    return path.join("::");
  }

  export function resolveRefNode(
    data: { $ref: string } | unknown,
    ctx: Context,
    params?: { deleteRef: boolean }
  ) {
    if (!isRef(data)) {
      return {
        pointer: undefined,
        resolved: resolveRef(data, ctx, params),
      };
    }
    return {
      pointer: data["$ref"],
      resolved: resolveRef(data, ctx, params),
    };
  }

  export function resolveRef(
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
      .enum([
        "integer",
        "number",
        "string",
        "boolean",
        "object",
        "null",
        "array",
      ])
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
}
