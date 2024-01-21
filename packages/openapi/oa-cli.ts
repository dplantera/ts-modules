#!/usr/bin/env ts-node

import { program } from "commander";
import * as process from "process";
import { createCommandGenerate } from "./src/index.js";
import { createCommandBundle } from "./src/commands.js";

createCommandGenerate(program);
createCommandBundle(program);

program.parse(process.argv);
