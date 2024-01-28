import { OpenApiBundled } from "../bundle.js";

import { ComponentNode, Schema } from "./transpile-schema.js";
import { Endpoint } from "./transpile-endpoint.js";
import { Resolver } from "./resolver.js";

export interface TranspileContext extends Resolver {
  schemas: Map<ComponentNode, Schema>;
  endpoints: Array<Endpoint>;
}

/** Resolving the oa spec just involves parsing and traversing openapi specified elements and components */
export module TranspileContext {
  export function create(bundled: OpenApiBundled): TranspileContext {
    const resolver = Resolver.create(bundled);
    return {
      ...resolver,
      schemas: new Map(),
      endpoints: [],
    };
  }
}
