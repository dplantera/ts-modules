/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { bundleOpenapi } from "../bundle.js";
import { postProcessModels, postProcessSpec } from "./post-process.js";
import { mergeAllOf } from "./merge-all-of.js";
import { generateTypescriptAxios } from "../generators/index.js";
import { _, Folder } from "@dsp/node-sdk";
import path from "path";
import jsonSchemaMergeAllOff from "json-schema-merge-allof";

describe("post process", () => {
  describe("spec", () => {
    describe("mergeAllOf", () => {
      test("lib", () => {
        const cache = { a: { minLength: 1 } };
        expect(
          jsonSchemaMergeAllOff(
            {
              allOf: [
                {
                  title: "a",
                  properties: {
                    a: { type: "string" },
                  },
                },
                {
                  title: "b",
                  properties: {
                    a: { $ref: "#/a" },
                  },
                },
              ],
            },
            {
              resolvers: {
                title: ([a, b]) => b ?? a!,
              },
            }
          )
        ).toEqual({
          properties: {
            a: {
              $ref: "#/a",
              type: "string",
            },
          },
          title: "b",
        });
      });
      test.each([
        "test/specs/pets-modular/pets-api.yml",
        "test/specs/pets-simple/pets-api.yml",
        "test/specs/pets-modular-complex/petstore-api.yml",
        "test/specs/generic/api.yml",
      ])("%s", async (api) => {
        const { parsed } = await bundleOpenapi(api, mergeAllOf);
        // const loc = Folder.of("out").writeYml("merged-all-of.yml", result as object);
        Folder.resolve(`test/out`, api).writeYml(path.basename(api), parsed);
        expect(parsed).toMatchSnapshot(api);
      });
    });
  });
});
