import path from "path";
import process from "process";
import { bundleOpenapi } from "./bundle.js";
import { postProcessModels, postProcessSpec } from "./post-process/post-process.js";
import { generateTypescriptAxios, generateZodSchemas } from "./generators/index.js";
import { Folder } from "@dsp/node-sdk";
import { log } from "./logger.js";

export async function generateOpenapi(inputFile: string | undefined, outputFile: string | undefined, params?: { clearTemp: boolean }) {
  try {
    const spec = inputFile ?? "test/specs/pets-modular/pets-api.yml";
    const output = outputFile ?? "test/out";
    const pathToApi = path.resolve(process.cwd(), spec);

    log.info("start bundle: ", pathToApi);
    const { parsed, outFile: bundled } = await bundleOpenapi(pathToApi, postProcessSpec);

    log.info(`start generate typescript-axios:`, bundled, output);
    const outDir = generateTypescriptAxios(bundled, output);

    log.info(`start generate typescript-axios:`, bundled, output);
    await generateZodSchemas(parsed, output);
    log.info(`start post processing:`, outDir);
    postProcessModels(outDir);
    if (params?.clearTemp ?? true) Folder.temp().clear();
    return outDir;
  } catch (e: unknown) {
    if (e instanceof Error) {
      log.error(`${e.name}: ${e.message}`);
    } else {
      log.error(`Something went wrong: ${JSON.stringify(e)}`);
    }
    process.exit(1);
  }
}
