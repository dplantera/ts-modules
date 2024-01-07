import { postProcessModels } from "./post-process.js";
import { bundleOpenapi } from "./bundle.js";
import { generateOpenapi } from "./index.js";
import { generateTypescriptAxios } from "./generators/ts-axios.js";
import { generateZodSchemas } from "./generators/zod.js";

test("bundle", async () => {
  const bundled = await bundleOpenapi("specs/pets-api.yml");
  expect(bundled).toBeDefined();
});

test("generate ts", async () => {
  const bundled = await bundleOpenapi("specs/pets-api.yml");
  generateTypescriptAxios(bundled, "out");
  expect(bundled).toBeDefined();
});

test("generate zod", async () => {
  const bundled = await bundleOpenapi("specs/pets-api.yml");
  const result = await generateZodSchemas(bundled, "out/zod.ts");
  expect(result).toBeDefined();
});

test("process", async () => {
  const bundled = await bundleOpenapi("specs/pets-api.yml");
  const outDir = generateTypescriptAxios(bundled, "out");
  postProcessModels(outDir);
  expect(bundled).toBeDefined();
});

test("generate openapi", async () => {
  const bundled = await generateOpenapi("specs/pets-api.yml", "out");
  expect(bundled).toBeDefined();
});
