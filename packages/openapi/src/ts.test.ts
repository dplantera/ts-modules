import {generateTypescriptAxios} from "./generate.js";
import { postProcessModels } from "./post-process-models.js";
import {bundleOpenapi} from "./bundle.js";

test("bundle", async () => {
    const bundled = await bundleOpenapi("specs/pets-api.yml")
    expect(bundled).toBeDefined()
})
test("generate", async () => {
    const bundled = await bundleOpenapi("specs/pets-api.yml")
    generateTypescriptAxios(bundled, "out")
    expect(bundled).toBeDefined()
})
test("process", async () => {
    const bundled = await bundleOpenapi("specs/pets-api.yml")
    const outDir = generateTypescriptAxios(bundled, "out")
    postProcessModels(outDir);
    expect(bundled).toBeDefined()
})