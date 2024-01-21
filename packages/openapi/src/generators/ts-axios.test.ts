import { Folder } from "@dsp/node-sdk";
import { bundleOpenapi } from "../bundle.js";
import { postProcessSpec } from "../post-process/post-process.js";
import { generateTypescriptAxios } from "./ts-axios.js";

describe("Generator: ts-axios", () => {
  test("generate generateTypescriptAxios", async () => {
    const { outFile: bundled } = await bundleOpenapi("test/specs/pets-modular/pets-api.yml", { postProcessor: postProcessSpec });
    const outFolder = generateTypescriptAxios(bundled, "test/out");
    const files = Folder.of(outFolder).readAllFilesAsString();
    files.forEach((f) => expect(f.content).toMatchSnapshot(`generate-ts-${f.src}`));
  });
});
