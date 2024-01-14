import { bundleOpenapi } from "../bundle.js";
import { postProcessModels, postProcessSpec } from "./post-process.js";
import { mergeAllOf } from "./merge-all-of.js";
import { generateTypescriptAxios } from "../generators/index.js";
import { Folder } from "@dsp/node-sdk";
import path from "path";
import jsonSchemaMergeAllOff from "json-schema-merge-allof";

describe("post process", () => {
  describe("spec", () => {
    describe("mergeAllOf", () => {
      test("lib", () => {
        expect(
          jsonSchemaMergeAllOff(
            { allOf: [{ title: "a" }, { title: "b" }] },
            {
              resolvers: {
                title: ([a, b]) => b ?? a!,
              },
            }
          )
        ).toEqual({ title: "b" });
      });
      test.each([
        "test/specs/pets-modular/pets-api.yml",
        "test/specs/pets-simple/pets-api.yml",
        "test/specs/pets-modular-complex/petstore-api.yml",
        "test/specs/generic/api.yml",
      ])("%s", async (api) => {
        const { parsed } = await bundleOpenapi(api);
        const result = mergeAllOf(parsed);
        // const loc = Folder.of("out").writeYml("merged-all-of.yml", result as object);
        Folder.resolve(`out`, api).writeYml(path.basename(api), result);
        expect(result).toMatchSnapshot(api);
      });
    });
  });

  describe("generated code", () => {
    test("ts types", async () => {
      const { outFile: bundled } = await bundleOpenapi("test/specs/pets-modular/pets-api.yml", postProcessSpec);
      const outDir = generateTypescriptAxios(bundled, "test/out");
      postProcessModels(outDir);
      const files = Folder.of(bundled).readAllFilesAsString();
      files.forEach((f) => expect(f.content).toMatchSnapshot(`post-process-${f.src}`));
    });
  });
});
