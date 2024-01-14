import { OpenApiBundled } from "../bundle.js";
import { File } from "@dsp/node-sdk";
import { generateZodClientFromOpenAPI } from "openapi-zod-client";
import url from "url";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));

const PATH_TEMPLATE = "../../templates/schemas-only.hbs";

/* todo: discriminator values are missing for oneOf
 *
 */
export async function generateZodSchemas(
  openapiSpec: OpenApiBundled,
  outDir: string
) {
  const outFilePath = File.of(outDir, "zod.ts").absolutPath;
  const templatePath = File.resolve(dirname, PATH_TEMPLATE).absolutPath;
  await generateZodClientFromOpenAPI({
    distPath: outFilePath,
    openApiDoc: openapiSpec,
    templatePath: templatePath,
  });
  return outFilePath;
}
