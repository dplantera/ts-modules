import {bundleOpenapi, OpenApiBundled} from "../../bundle.js";
import {createSpecProcessor} from "../../post-process/index.js";
import {generateZod} from "./zod-schemas.js";

describe("generateZod", () => {
    test.each([
        "test/specs/pets-modular/pets-api.yml",
        "test/specs/pets-simple/pets-api.yml",
        "test/specs/pets-modular-complex/petstore-api.yml",
        "test/specs/generic/api.yml",
    ])("generates %s", async (api) => {
        const {parsed} = await bundleOpenapi(api, {
            postProcessor: createSpecProcessor({
                mergeAllOf: true,
                ensureDiscriminatorValues: true,
            }),
        });
        const name = api.replace("test/specs", "").replace(".yml", "");
        const {sourceFile} = await generateZod(parsed, `test/out/zod/${name}.ts`);

        expect(sourceFile.getFullText()).toMatchSnapshot(name);
    });


    test("circular schema", async () => {
        const openapi: OpenApiBundled = {
            openapi: "3.0.3",
            info: {version: "", title: ""},
            paths: {},
            components: {
                schemas: {
                    "Node": {
                        type: "object",
                        properties: {
                            id: {type: "string"},
                            parent: {$ref: '#/components/schemas/Node'},
                            children: {type: "array", items: {$ref: '#/components/schemas/Node'}}
                        }
                    }
                }
            }
        }

        const {sourceFile} = await generateZod(openapi, `test/out/zod/circular.ts`);

        expect(sourceFile.getFullText()).toMatchSnapshot("circular");
    })
});
