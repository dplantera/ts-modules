import { Folder } from "@dsp/node-sdk";
import { generateOpenapi } from "./index.js";

test("ggenerate openapi integration", async () => {
  const bundled = await generateOpenapi("test/specs/pets-modular/pets-api.yml", "test/out", { clearTemp: false });
  const files = Folder.of(bundled).readAllFilesAsString();
  files.forEach((f) => expect(f.content).toMatchSnapshot(`generate-openapi-${f.src}`));
});
