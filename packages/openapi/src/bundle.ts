import { bundle, createConfig } from "@redocly/openapi-core";
import * as path from "path";
import { Folder } from "./folder.js";
import { oas30 } from "openapi3-ts";
import _ from "lodash";

export interface OpenApiBundled extends oas30.OpenAPIObject {}

export async function bundleOpenapi(
  pathToApi: string,
  postProcessor?: (bundled: OpenApiBundled) => OpenApiBundled
) {
  const bundleResults = await parseOpenapi(pathToApi);
  const apiName = path.basename(pathToApi);
  const parsed: OpenApiBundled = _.isNil(postProcessor)
    ? bundleResults.bundle.parsed
    : postProcessor(bundleResults.bundle.parsed);
  return {
    parsed,
    outFile: Folder.temp().writeYml(`bundled-${apiName}`, parsed),
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
