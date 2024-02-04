import { OpenApiBundled } from "../bundle.js";

import { ComponentNode, Schema } from "./transpile-schema.js";
import { Endpoint } from "./transpile-endpoint.js";
import { Resolver } from "./resolver.js";

export interface TranspileContext {
  resolver: Resolver;
  schemas: Map<ComponentNode, Schema>;
  visited: Map<ComponentNode, ComponentNode>;
  last: ComponentNode | undefined;
  endpoints: Array<Endpoint>;

  clean(): TranspileContext;
}

/** Resolving the oa spec just involves parsing and traversing openapi specified elements and components */
export module TranspileContext {
  export function create(bundled: OpenApiBundled): TranspileContext {
    const resolver = Resolver.create(bundled);
    return {
      clean() {
        if (this.schemas) {
          this.schemas.forEach((s) => {
            if ("::ref" in s.raw) {
              delete s.raw["::ref"];
            }
          });
        }
        return this;
      },
      resolver,
      visited: new Map(),
      schemas: new Map(),
      last: undefined,
      endpoints: [],
    };
  }
}
