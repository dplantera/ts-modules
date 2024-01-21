import { Folder } from "@dsp/node-sdk";
import { generateOpenapi } from "./index.js";
import path from "path";

test("ggenerate openapi integration", async () => {
  // const bundled = await generateOpenapi("test/specs/pets-modular/pets-api.yml", "test/out", { clearTemp: false });
  const bundled = await generateOpenapi("test/specs/generic/api.yml", "test/out", { clearTemp: false });
  const files = Folder.of(bundled).readAllFilesAsString();
  files.forEach((f) => expect(f.content).toMatchSnapshot(`generate-openapi-${f.src}`));
});

describe("Generate Integration", () => {
  test.each([
    "test/specs/pets-modular/pets-api.yml",
    "test/specs/pets-simple/pets-api.yml",
    "test/specs/pets-modular-complex/petstore-api.yml",
    "test/specs/generic/api.yml",
  ])("%s", async (api) => {
    const out = Folder.resolve("test/out", path.dirname(api)).absolutePath;
    const bundled = await generateOpenapi(api, out, { clearTemp: false });
    const files = Folder.of(bundled).readAllFilesAsString();
    files.forEach((f) => expect(f.content).toMatchSnapshot(`generate-openapi-${f.src}`));
  });
});
