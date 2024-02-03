import { childLog } from "../../logger.js";
import { File } from "@dsp/node-sdk";

import { OpenApiBundled } from "../../bundle.js";
import { generateZod } from "./zod-schemas.js";

export async function generateZodSchemas(openapiSpec: OpenApiBundled, outFile: string) {
  childLog(generateZodSchemas).info(`start generate: %s`, outFile);
  const outFilePath = File.of(outFile).absolutPath;
  const { sourceFile } = await generateZod(openapiSpec, File.resolve(outFile).absolutPath);
  sourceFile.saveSync();
  return outFilePath;
}
