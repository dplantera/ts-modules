import { Schema } from "./transpile-schema.js";
import { log } from "../logger.js";
import { _ } from "@dsp/node-sdk";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import toposort from "toposort";

export module Toposort {
  export function sortSchemas(schemas: Array<Schema>): Array<Schema> {
    const collectedEdges: Map<Schema, Set<Schema>> = new Map();
    const nodes = new Set<Schema>();
    schemas.forEach((s) => collectEdges(s, undefined, collectedEdges, nodes));
    const edges = Array.from(collectedEdges.entries()).reduce(
      (acc, entry) => {
        const [parent, children] = entry as unknown as [Schema, Set<Schema>];
        return [...acc, ...Array.from(children).map((c) => [parent, c])];
      },
      <Array<Array<Schema>>>[],
    );
    try {
      const sorted: Array<Schema> = toposort.array(
        Array.from(nodes.values()).filter((d) => d.component.kind === "COMPONENT"),
        edges,
      );
      // parent of a schema got produced twice - maybe we need to migrate to ids to avoid that...
      return ensureUniqueSchemas(sorted);
    } catch (e) {
      throw "Error: could not create dependency graph: " + (e as Error).message;
    }
  }

  function ensureUniqueSchemas(sorted: Array<Schema>) {
    const grouped = _.groupBy(sorted.reverse(), (a) => a.getName());
    return Object.values(grouped).reduce((acc, curr) => [...acc, curr[0]], []);
  }

  function collectEdges(child: Schema, parent: Schema | undefined, ctx: Map<Schema, Set<Schema | Schema.DiscriminatorProperty>>, nodes: Set<Schema>) {
    if (!nodes.has(child)) {
      nodes.add(child);
    }
    if (_.isDefined(parent) && !nodes.has(parent)) {
      nodes.add(parent);
    }
    function withoutCircles(s: Schema, fn: () => void) {
      if (s.isCircular) return;
      return fn();
    }
    function addEdge(_parent: Schema, _child: Schema) {
      if (!ctx.has(_parent)) {
        ctx.set(_parent, new Set());
      }
      ctx.get(_parent)?.add(_child);
    }
    // only components which we can identify
    if (child.getName() === parent?.getName()) {
      log.warn(`recursion found ${child.getName()} - skip`);
      return;
    }
    if (_.isDefined(parent) && child.component.kind === "COMPONENT") {
      addEdge(parent, child);
    }

    switch (child.kind) {
      case "ARRAY":
        withoutCircles(child.items, () => collectEdges(child.items, child, ctx, nodes));
        return;
      case "UNION":
        child.schemas.forEach((s) => withoutCircles(s, () => collectEdges(s, child, ctx, nodes)));
        return;
      case "OBJECT":
        child.properties.flatMap((d) => (d.kind === "DISCRIMINATOR" ? [] : [d])).forEach((s) => withoutCircles(s, () => collectEdges(s, child, ctx, nodes)));
        if (_.isDefined(child.parent)) {
          addEdge(child, child.parent);
          collectEdges(child.parent, undefined, ctx, nodes);
        }
        return;
      case "PRIMITIVE":
      case "ENUM":
      case "BOX":
        return;
    }
  }
}
