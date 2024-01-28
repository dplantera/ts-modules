/* eslint-disable no-inner-declarations,@typescript-eslint/no-explicit-any */
import { oas30 } from "openapi3-ts";
import { z } from "zod";
import { TopologicalSort } from "topological-sort";
import { _ } from "@dsp/node-sdk";
import { OpenApiBundled } from "../bundle.js";
import { Resolver } from "./resolver.js";

export function cleanObj<T extends Record<string, any>>(obj: T, except: Array<keyof T>) {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (except.includes(prop)) {
      return;
    }
    delete obj[prop];
  });
  return obj;
}

export type Node = oas30.SchemaObject | undefined | { [key: string]: Node };

export interface DeepSchemaResolverContext extends Resolver {
  root: OpenApiBundled;
  visited: Map<string, Node>;
  nodes: Map<Node, Node>;
  edges: Map<Node, Array<Node>>;
  path: { all: Array<Array<string>>; current: Array<string> };
}

export module DeepSchemaResolverContext {
  export function create(bundled: OpenApiBundled): DeepSchemaResolverContext {
    const visited = new Map();
    const nodes = new Map();
    const edges = new Map();
    const path = {
      all: <Array<Array<string>>>[],
      current: <Array<string>>[],
    };
    const resolver = Resolver.create(bundled);
    return { ...resolver, visited, nodes, edges, path };
  }
}

/** Deep resolving means we will traverse all field in the openapi documents in order to finde the possible schemas s*/
export module DeepSchemaResolver {
  export type CollectCondition = (schema: oas30.SchemaObject) => boolean;
  export function findSchemaObjectsWith(bundled: OpenApiBundled, ...conditions: Array<CollectCondition>) {
    /* CONTEXT */
    const context = DeepSchemaResolverContext.create(bundled);
    /* COLLECT */
    collectDFS(bundled, undefined, conditions, context);
    const { nodes, edges } = context;
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
      collected: collected.filter(_.isDefined),
      ctx: context,
    };
  }

  function collectDFS(node: Node, parent: Node | undefined, visitors: Array<CollectCondition>, ctx: DeepSchemaResolverContext) {
    if (_.isEmpty(node) || typeof node !== "object" || ctx.visited.has(toNodeId(ctx.path.current))) {
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
      const resolved = ctx.resolveRef(refObj.data);
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

  const SchemaObject = z.object({
    discriminator: z.record(z.any()).optional(),
    type: z.enum(["integer", "number", "string", "boolean", "object", "null", "array"]).optional(),
    allOf: z.array(z.any()).optional(),
    oneOf: z.array(z.any()).optional(),
    anyOf: z.array(z.any()).optional(),
    items: z.record(z.any()).optional(),
    properties: z.record(z.any()).optional(),
    additionalProperties: z.object({}).optional(),
  });

  export function isSchema(node: Node | unknown): node is oas30.SchemaObject {
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
