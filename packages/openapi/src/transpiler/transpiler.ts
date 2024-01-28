import { OpenApiBundled } from "../bundle.js";
import { Endpoint } from "./transpile-endpoint.js";
import { Schema } from "./transpile-schema.js";
import { TranspileContext } from "./transpile-context.js";
import { TopologicalSort } from "topological-sort";
import { _ } from "@dsp/node-sdk";

export module Transpiler {
  export function of(bundled: OpenApiBundled) {
    const resolver = TranspileContext.create(bundled);
    return {
      endpoints() {
        return resolver.endpoints.length > 0 ? resolver.endpoints : Endpoint.transpileAll(resolver);
      },
      schemas() {
        return resolver.schemas.size > 0 ? Array.from(resolver.schemas.values()) : Schema.transpileAll(resolver) ?? [];
      },
      schemasTopoSorted() {
        const schemas = this.schemas();
        return topoSort(schemas);
      },
    };
  }
}

function collectEdges(schema: Schema, ctx: Map<Schema, Set<Schema | Schema.DiscriminatorProperty>>) {
  switch (schema.kind) {
    case "ARRAY":
      if (!ctx.has(schema)) {
        ctx.set(schema, new Set());
      }
      ctx.get(schema)?.add(schema.items);
      return;
    case "UNION":
      if (!ctx.has(schema)) {
        ctx.set(schema, new Set());
      }
      schema.schemas.forEach((s) => ctx.get(schema)?.add(s));
      return;
    case "OBJECT":
      if (!ctx.has(schema)) {
        ctx.set(schema, new Set());
      }
      schema.properties.forEach((s) => ctx.get(schema)?.add(s));
      if (_.isDefined(schema.parent)) {
        if (!ctx.has(schema.parent)) {
          ctx.set(schema.parent, new Set());
        }
        ctx.get(schema.parent)?.add(schema);
      }
      return;
    case "PRIMITIVE":
    case "ENUM":
      return;
  }
}

function topoSort(schemas: Array<Schema>) {
  const edges = new Map();
  schemas.forEach((s) => collectEdges(s, edges));
  const _nodes = Array.from(new Set([...Array.from(edges.values()).flatMap((s) => Array.from(s)), ...Array.from(edges.keys())]));
  const nodes = _nodes.reduce((acc, c) => {
    acc.set(c, c);
    return acc;
  }, new Map());
  try {
    const sortOp = new TopologicalSort(nodes);

    for (const [parent, children] of edges.entries()) {
      if (!parent) {
        continue;
      }
      Array.from(children).forEach((v) => {
        if (!v) {
          return;
        }
        if (!nodes.has(v)) {
          nodes.set(v, v);
          sortOp.addNode(v, v);
        }
        sortOp.addEdge(parent, v);
      });
    }
    return Array.from(sortOp.sort().keys()).reverse();
  } catch (e) {
    throw "Error: could not create dependency graph";
  }
}
