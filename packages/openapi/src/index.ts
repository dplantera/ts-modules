import path from "path";
import process from "process";
import { bundleOpenapi } from "./bundle.js";
import { Folder } from "./folder.js";
import { generateTypescriptAxios } from "./generators/ts-axios.js";
import { generateZodSchemas } from "./generators/index.js";
import { postProcessModels } from "./post-process/index.js";
import { postProcessSpec } from "./post-process/post-process.js";

export async function generateOpenapi(
  inputFile: string | undefined,
  outputFile: string | undefined
) {
  try {
    const spec = inputFile ?? "test/specs/pets-modular/pets-api.yml";
    const output = outputFile ?? "test/out";
    const pathToApi = path.resolve(process.cwd(), spec);

    console.log("start bundle: ", pathToApi);
    const { parsed, outFile: bundled } = await bundleOpenapi(pathToApi);

    console.log(`start generate typescript-axios:`, bundled, output);
    const outDir = generateTypescriptAxios(bundled, output);

    console.log(`start generate typescript-axios:`, bundled, output);
    await generateZodSchemas(parsed, output);

    console.log(`start post processing:`, outDir);
    postProcessSpec(parsed);
    postProcessModels(outDir);
    Folder.temp().clear();
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
