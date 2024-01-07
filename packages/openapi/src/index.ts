import path from "path";
import process from "process";
import { bundleOpenapi } from "./bundle.js";
import { postProcessModels } from "./post-process.js";
import { tempFolder } from "./folder.js";
import { generateTypescriptAxios } from "./generators/ts-axios.js";
import { generateZodSchemas } from "./generators/index.js";

export async function generateOpenapi(
  inputFile: string | undefined,
  outputFile: string | undefined
) {
  try {
    const spec = inputFile ?? "specs/pets-api.yml";
    const output = outputFile ?? "out";
    const pathToApi = path.resolve(process.cwd(), spec);

    console.log("start bundle: ", pathToApi);
    const bundled = await bundleOpenapi(pathToApi);

    console.log(`start generate typescript-axios:`, bundled, output);
    const outDir = generateTypescriptAxios(bundled, output);

    console.log(`start generate typescript-axios:`, bundled, output);
    await generateZodSchemas(bundled, output);

    console.log(`start post processing:`, outDir);
    postProcessModels(outDir);
    tempFolder().deleteAll();
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
