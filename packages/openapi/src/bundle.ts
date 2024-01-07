import { bundle, createConfig } from "@redocly/openapi-core";
import * as path from "path";
import { Folder } from "./folder.js";

export async function bundleOpenapi(pathToApi: string) {
  const bundleResults = await parseOpenapi(pathToApi);
  const apiName = path.basename(pathToApi);
  return Folder.temp().writeYml(
    `bundled-${apiName}`,
    bundleResults.bundle.parsed
  );
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
