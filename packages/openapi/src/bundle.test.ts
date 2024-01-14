import { bundleOpenapi, parseOpenapi } from "./bundle.js";
import { postProcessSpec } from "./post-process/post-process.js";

describe("Bundler", () => {
  describe("bundle", () => {
    test("bundleOpenapi", async () => {
      const bundled = await bundleOpenapi(
        "test/specs/pets-modular/pets-api.yml",
        postProcessSpec
      );
      expect(bundled).toMatchSnapshot();
    });
  });
  describe("parse", () => {
    test("parseOpenapi", async () => {
      const bundled = await parseOpenapi(
        "test/specs/pets-modular/pets-api.yml"
      );
      expect(bundled).toMatchSnapshot();
    });
  });
});
