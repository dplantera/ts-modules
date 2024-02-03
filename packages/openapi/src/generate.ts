import process from "process";
import { bundleOpenapi } from "./bundle.js";
import { createSpecProcessor, createTsPostProcessor } from "./post-process/index.js";
import { generateTypescriptAxios, generateZodSchemas } from "./generators/index.js";
import { File, Folder } from "@dsp/node-sdk";
import { log } from "./logger.js";

export async function generateOpenapi(inputFile: string, outputFile: string, params?: { clearTemp: boolean }) {
  try {
    const spec = inputFile;
    const output = outputFile;

    const { parsed, outFile: bundled } = await bundleOpenapi(spec, {
      postProcessor: createSpecProcessor({ mergeAllOf: true, ensureDiscriminatorValues: true }),
    });
    const outDir = generateTypescriptAxios(bundled, output, {
      generateZod: true,
      postProcessor: createTsPostProcessor({ deleteUnwantedFiles: true, ensureDiscriminatorValues: true }),
    });
    await generateZodSchemas(parsed, File.of(output, "zod.ts").absolutPath);

    // save spec where the code is generated
    Folder.of(outDir).writeYml(File.of(bundled).name, parsed);

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
