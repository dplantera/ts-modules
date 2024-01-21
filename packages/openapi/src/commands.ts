import { Command } from "commander";
import { generateOpenapi } from "./generate.js";
import { log } from "./logger.js";
import { bundleOpenapi } from "./bundle.js";
import { createSpecProcessor } from "./post-process/post-process.js";

export function createCommandGenerate(program: Command): Command {
  return program
    .command("generate")
    .argument("<openapi-spec>", "Relative filepath from the current cwd to the OpenApi root document file")
    .option("-o, --output [output]", "Target directory wehre the generated files will appear", "out")
    .action(async (spec: string, options: { output: string }) => {
      const result = await withPerformance(() => generateOpenapi(spec, options.output));
      log.info(`finished generate in ${(result.duration / 1000).toFixed(3)} s`, result.ret);
    });
}

export function createCommandBundle(program: Command): Command {
  return program
    .command("bundle")
    .argument("<openapi-spec>", "Absolut or Relative filepath from the cwd to the OpenApi root document file")
    .option("-o, --outputFile [outputFile]", "Absolut or relative filepath to cwd of the resulting bundled file")
    .option("--disableMergeAllOf", "If set, allOf arrays will be left as is after bundling")
    .option("--disableEnsureDiscriminatorValues", "If set, discriminator values won't be ensured on every subType")
    .action(async (spec: string, options: { outputFile?: string; disableMergeAllOf?: boolean; disableEnsureDiscriminatorValues?: boolean }) => {
      const postProcessor = createSpecProcessor({
        mergeAllOf: options.disableMergeAllOf ?? true,
        ensureDiscriminatorValues: options.disableEnsureDiscriminatorValues ?? true,
      });
      const result = await withPerformance(() => bundleOpenapi(spec, { postProcessor, outFile: options.outputFile }));
      log.info(`finished generate in ${(result.duration / 1000).toFixed(3)} s`, result.ret);
    });
}

async function withPerformance<T>(fun: () => Promise<T>) {
  const start = performance.now();
  const ret = await fun();
  const end = performance.now();
  return { duration: end - start, ret };
}
