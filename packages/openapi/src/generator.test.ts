import { bundleOpenapi, parseOpenapi } from "./bundle.js";
import { generateOpenapi } from "./index.js";
import { generateTypescriptAxios } from "./generators/ts-axios.js";
import { generateZodSchemas } from "./generators/zod.js";
import { postProcessModels } from "./post-process/index.js";
import { mergeAllOf } from "./post-process/merge-all-of.js";
import { postProcessSpec } from "./post-process/post-process.js";

test("bundleOpenapi", async () => {
  const bundled = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml",
    postProcessSpec
  );
  expect(bundled).toMatchSnapshot();
});

test("parseOpenapi", async () => {
  const bundled = await parseOpenapi("test/specs/pets-modular/pets-api.yml");
  expect(bundled).toMatchSnapshot();
});

test("generate ts", async () => {
  const { outFile: bundled } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml",
    postProcessSpec
  );
  generateTypescriptAxios(bundled, "test/out");
  expect(bundled).toMatchSnapshot();
});

test("generate zod", async () => {
  const { parsed } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml",
    postProcessSpec
  );
  const result = await generateZodSchemas(parsed, "out/zod.ts");
  expect(result).toMatchSnapshot();
});

test("merge all of", async () => {
  const { parsed } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml",
    postProcessSpec
  );
  const result = mergeAllOf(parsed);
  // const loc = Folder.of("out").writeYml("merged-all-of.yml", result as object);
  expect(result).toMatchSnapshot();
});

test("generate openapi", async () => {
  const bundled = await generateOpenapi(
    "test/specs/pets-modular/pets-api.yml",
    "test/out",
    { clearTemp: false }
  );
  expect(bundled).toMatchSnapshot();
});

test("process", async () => {
  const { outFile: bundled } = await bundleOpenapi(
    "test/specs/pets-modular/pets-api.yml",
    postProcessSpec
  );
  const outDir = generateTypescriptAxios(bundled, "test/out");
  postProcessModels(outDir);
  expect(bundled).toMatchSnapshot();
});
