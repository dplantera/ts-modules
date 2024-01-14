import { Source, bundle, createConfig } from "@redocly/openapi-core";
import * as path from "path";
import { oas30 } from "openapi3-ts";
import { _, Folder } from "@dsp/node-sdk";

export interface OpenApiBundled extends oas30.OpenAPIObject {}

export async function bundleOpenapi(pathToApi: string, postProcessor?: (bundled: OpenApiBundled) => OpenApiBundled) {
  const bundleResults = await parseOpenapi(pathToApi);
  const apiName = path.basename(pathToApi);
  const parsed: OpenApiBundled = _.isNil(postProcessor) ? bundleResults.bundle.parsed : postProcessor(bundleResults.bundle.parsed);
  const cleanedParsed = _.isNil(postProcessor) ? parsed : (await doBundle(bundleResults.bundle.source, parsed)).bundle.parsed;

  return { parsed: cleanedParsed, outFile: Folder.temp().writeYml(`bundled-${apiName}`, cleanedParsed) };
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

export async function doBundle(source: Source, parsed: object) {
  const config = await createConfig({});
  return bundle({
    doc: { parsed, source },
    config,
    removeUnusedComponents: true,
    dereference: false,
    skipRedoclyRegistryRefs: true,
  });
}
