import { bundleOpenapi } from "../bundle.js";
import { postProcessModels, postProcessSpec } from "./post-process.js";
import { mergeAllOf } from "./merge-all-of.js";
import { generateTypescriptAxios } from "../generators/index.js";
import { Folder } from "@dsp/node-sdk";

describe("post process", () => {
  describe("spec", () => {
    test("merge all of", async () => {
      const { parsed } = await bundleOpenapi(
        "test/specs/pets-modular/pets-api.yml",
        postProcessSpec
      );
      const result = mergeAllOf(parsed);
      // const loc = Folder.of("out").writeYml("merged-all-of.yml", result as object);
      expect(result).toMatchSnapshot();
    });
  });

  describe("generated code", () => {
    test("ts types", async () => {
      const { outFile: bundled } = await bundleOpenapi(
        "test/specs/pets-modular/pets-api.yml",
        postProcessSpec
      );
      const outDir = generateTypescriptAxios(bundled, "test/out");
      postProcessModels(outDir);
      const files = Folder.of(bundled).readAllFilesAsString();
      files.forEach((f) =>
        expect(f.content).toMatchSnapshot(`post-process-${f.src}`)
      );
    });
  });
});
