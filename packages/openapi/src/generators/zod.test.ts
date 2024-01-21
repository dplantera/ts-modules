import { bundleOpenapi } from "../bundle.js";
import { postProcessSpec } from "../post-process/post-process.js";
import { generateZodSchemas } from "./zod.js";

describe("Generator: zod", () => {
  test("generate", async () => {
    const { parsed } = await bundleOpenapi("test/specs/pets-modular/pets-api.yml", { postProcessor: postProcessSpec });
    const result = await generateZodSchemas(parsed, "out/zod.ts");
    expect(result).toMatchSnapshot();
  });
});
