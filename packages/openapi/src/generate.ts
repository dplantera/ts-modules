import * as child_process from "node:child_process";
import * as path from "path";
import * as process from "process";
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export  function generateTypescriptAxios(openapiSpec: string, out: string){
    const outDir = path.isAbsolute(out) ? out : path.resolve(process.cwd(), out);
    const templateDir = path.resolve(__dirname, "..","templates")
    child_process.execSync(`openapi-generator-cli generate -g typescript-axios -i "${openapiSpec}" -o "${outDir}" -t "${templateDir}"`)
    return outDir;
}


