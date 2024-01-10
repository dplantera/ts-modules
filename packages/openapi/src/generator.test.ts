import { bundleOpenapi, parseOpenapi } from "./bundle.js";
import { generateOpenapi } from "./index.js";
import { generateTypescriptAxios } from "./generators/ts-axios.js";
import { generateZodSchemas } from "./generators/zod.js";
import { postProcessModels } from "./post-process/index.js";
import { mergeAllOf } from "./post-process/merge-all-of.js";

test("bundleOpenapi", async () => {
  const bundled = await bundleOpenapi("test/specs/pets-modular/pets-api.yml");
  expect(bundled).toBeDefined();
});

test("parseOpenapi", async () => {
  const bundled = await parseOpenapi("test/specs/pets-modular/pets-api.yml");
  expect(bundled).toBeDefined();
});

test("generate ts", async () => {
  const { outFile: bundled } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml"
  );
  generateTypescriptAxios(bundled, "test/out");
  expect(bundled).toBeDefined();
});

test("generate zod", async () => {
  const { parsed } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml"
  );
  const result = await generateZodSchemas(parsed, "out/zod.ts");
  expect(result).toBeDefined();
});

test("merge all of", async () => {
  const { parsed } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml"
  );
  const result = mergeAllOf(parsed);
  // const loc = Folder.of("out").writeYml("merged-all-of.yml", result as object);
  expect(result).toBeDefined();
});

test("generate openapi", async () => {
  const bundled = await generateOpenapi(
    "test/specs/pets-modular/pets-api.yml",
    "test/out"
  );
  expect(bundled).toBeDefined();
});

test("process", async () => {
  const { outFile: bundled } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml"
  );
  const outDir = generateTypescriptAxios(bundled, "test/out");
  postProcessModels(outDir);
  expect(bundled).toBeDefined();
});
