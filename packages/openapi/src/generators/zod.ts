import { OpenApiBundled } from "../bundle.js";
import { _, File } from "@dsp/node-sdk";
import { generateZodClientFromOpenAPI } from "openapi-zod-client";
import url from "url";
import { childLog } from "../logger.js";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));

const PATH_TEMPLATE = "../../templates/schemas-only.hbs";

/* todo: discriminator values are missing for oneOf
 *
 */
export async function generateZodSchemas(openapiSpec: OpenApiBundled, outDir: string, params?: { postProcessor?: (api: string) => string }) {
  childLog(generateZodSchemas).info(`start generate: %s`, outDir);
  const outFilePath = File.of(outDir, "zod.ts").absolutPath;
  const templatePath = File.resolve(dirname, PATH_TEMPLATE).absolutPath;
  await generateZodClientFromOpenAPI({
    distPath: outFilePath,
    openApiDoc: openapiSpec,
    templatePath: templatePath,
  });

  if (_.isDefined(params?.postProcessor)) params.postProcessor(outFilePath);
  return outFilePath;
}
