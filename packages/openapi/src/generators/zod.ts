import { parseOpenapi } from "../bundle.js";
import { File } from "../folder.js";
import { generateZodClientFromOpenAPI } from "openapi-zod-client";
import url from "url";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));

const PATH_TEMPLATE = "../../templates/schemas-only.hbs";
export async function generateZodSchemas(openapiSpec: string, outDir: string) {
  const parseResult = await parseOpenapi(openapiSpec);
  const outFilePath = File.of(outDir, "zod.ts").absolutPath;
  const templatePath = File.resolve(dirname, PATH_TEMPLATE).absolutPath;
  await generateZodClientFromOpenAPI({
    distPath: outFilePath,
    openApiDoc: parseResult.bundle.parsed as never,
    templatePath: templatePath,
  });
  return outFilePath;
}
