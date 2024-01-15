#!/usr/bin/env ts-node

import { program } from "commander";
import * as process from "process";
import { generateOpenapi } from "./src/index.js";
import { log } from "./src/logger.js";

program
  .command("generate")
  .argument("<openapi-spec>", "Relative filepath from the current cwd to the OpenApi root document file")
  .option("-o, --output <output>", "Target directory wehre the generated files will appear")
  .action(async (spec: string, options: { output: string }) => {
    const result = await withPerformance(() => generateOpenapi(spec, options.output));
    log.info(`finished generate in ${(result.duration / 1000).toFixed(3)} s`, result.ret);
  });

async function withPerformance<T>(fun: () => Promise<T>) {
  const start = performance.now();
  const ret = await fun();
  const end = performance.now();
  return { duration: end - start, ret };
}

program.parse(process.argv);
