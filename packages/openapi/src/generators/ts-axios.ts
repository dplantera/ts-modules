import path from "path";
import process from "process";
import child_process from "node:child_process";
import url from "url";
import { folder } from "../folder.js";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));

export function generateTypescriptAxios(openapiSpec: string, out: string) {
  const outDir = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);
  const templateDirPath = folder(
    path.resolve(dirname, "..", "..", "templates")
  ).absolutePath;

  child_process.execSync(
    `openapi-generator-cli generate -g typescript-axios -i "${openapiSpec}" -o "${outDir}" -t "${templateDirPath}"`
  );
  return outDir;
}
