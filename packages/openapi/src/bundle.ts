import { bundle, createConfig } from "@redocly/openapi-core";
import * as path from "path";
import { Folder } from "./folder.js";
import { oas30 } from "openapi3-ts";

export interface OpenApiBundled extends oas30.OpenAPIObject {}
export async function bundleOpenapi(pathToApi: string) {
  const bundleResults = await parseOpenapi(pathToApi);
  const apiName = path.basename(pathToApi);
  return {
    parsed: bundleResults.bundle.parsed as OpenApiBundled,
    outFile: Folder.temp().writeYml(
      `bundled-${apiName}`,
      bundleResults.bundle.parsed
    ),
  };
}

export async function parseOpenapi(pathToApi: string) {
  const config = await createConfig({});
  return bundle({
    ref: pathToApi,
    config,
    removeUnusedComponents: true,
    dereference: false,
    skipRedoclyRegistryRefs: true,
  });
}
