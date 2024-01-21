import { bundleOpenapi } from "../bundle.js";
import { generateZodSchemas } from "./zod.js";
import { createSpecProcessor } from "../post-process/index.js";

describe("Generator: zod", () => {
  test("generate", async () => {
    const { parsed } = await bundleOpenapi("test/specs/pets-modular/pets-api.yml", {
      postProcessor: createSpecProcessor({
        mergeAllOf: true,
        ensureDiscriminatorValues: true,
      }),
    });
    const result = await generateZodSchemas(parsed, "out/zod.ts");
    expect(result).toMatchSnapshot();
  });
});
