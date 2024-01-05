#!/usr/bin/env ts-node

import {program} from "commander";
import * as process from "process";
import * as path from "path";
import {bundleOpenapi} from "./src/bundle.js";
import {generateTypescriptAxios} from "./src/generate.js";
import {postProcessModels} from "./src/post-process-models.js";
import {tempFolder} from "./src/folder.js";

program
    .command("generate")
    .argument("<openapi-spec>", 'Relative filepath from the current cwd to the OpenApi root document file')
    .option("-o, --output <output>", 'Target directory wehre the generated files will appear')
    .action(async (spec: string, options: { output: string }) => {
        const result = await withPerformance(async () => {
                const pathToApi = path.resolve(process.cwd(), spec);
                console.log("start bundle: ", pathToApi)
                const bundled = await bundleOpenapi(pathToApi)
                console.log(`start generate`, bundled, options.output)
                const generated = generateTypescriptAxios(bundled, options.output)
                console.log(`start processing`, generated)
                postProcessModels(generated)
                tempFolder().deleteAll();
                return generated;
        })

        console.log(`finished generate in ${(result.duration/1000).toFixed(3)} s`, result.ret)
    })

async function withPerformance<T>(fun: (() => Promise<T>)){
        const start = performance.now()
        const ret = await fun();
        const end = performance.now();
        return {duration: end - start, ret };
}

program.parse(process.argv)