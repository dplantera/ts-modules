import path from "path";
import process from "process";
import { bundleOpenapi } from "./bundle.js";
import {
  postProcessModels,
  postProcessSpec,
} from "./post-process/post-process.js";
import {
  generateTypescriptAxios,
  generateZodSchemas,
} from "./generators/index.js";
import { Folder } from "@dsp/node-sdk";

export async function generateOpenapi(
  inputFile: string | undefined,
  outputFile: string | undefined,
  params?: { clearTemp: boolean }
) {
  try {
    const spec = inputFile ?? "test/specs/pets-modular/pets-api.yml";
    const output = outputFile ?? "test/out";
    const pathToApi = path.resolve(process.cwd(), spec);

    console.log("start bundle: ", pathToApi);
    const { parsed, outFile: bundled } = await bundleOpenapi(
      pathToApi,
      postProcessSpec
    );

    console.log(`start generate typescript-axios:`, bundled, output);
    const outDir = generateTypescriptAxios(bundled, output);

    console.log(`start generate typescript-axios:`, bundled, output);
    await generateZodSchemas(parsed, output);

    console.log(`start post processing:`, outDir);
    postProcessModels(outDir);
    if (params?.clearTemp ?? true) Folder.temp().clear();
    return outDir;
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(`${e.name}: ${e.message}`);
    } else {
      console.error(`Something went wrong: ${JSON.stringify(e)}`);
    }
    process.exit(1);
  }
}
