import { bundleOpenapi } from "../bundle.js";
import { createSpecProcessor } from "../post-process/index.js";
import { Transpiler } from "./transpiler.js";

describe("transpiler", () => {
  test("endpoints", async () => {
    const { parsed } = await bundleOpenapi("test/specs/pets-modular/pets-api.yml", {
      postProcessor: createSpecProcessor({
        mergeAllOf: true,
        ensureDiscriminatorValues: true,
      }),
    });
    // const schemas = await generateZod(parsed);
    const spec = Transpiler.of(parsed);
    const endpoints = spec.endpoints();
    expect(endpoints).toMatchSnapshot("endpoints");
  });

  test("schemas", async () => {
    const { parsed } = await bundleOpenapi("test/specs/pets-modular/pets-api.yml", {
      postProcessor: createSpecProcessor({
        mergeAllOf: true,
        ensureDiscriminatorValues: true,
      }),
    });
    const spec = Transpiler.of(parsed);
    const schemas = spec.schemasTopoSorted();
    expect(schemas).toMatchSnapshot("schemas");
  });
});
