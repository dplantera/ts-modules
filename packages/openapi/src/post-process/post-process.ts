import { Folder } from "../folder.js";
import { Project, SourceFile } from "ts-morph";
import path from "node:path";
import _ from "lodash";
import { tsEnsureDiscriminatorValues } from "./ts-ensure-discriminator-values.js";
import { zodReplaceAnd } from "./zod-replace-and.js";
import { deleteUnwantedFiles } from "./delete-unwanted-files.js";

/**
 * Add discriminator values on oneOf interfaces
 * @param outDir File containing all ts interfaces
 */
export function postProcessModels(outDir: string) {
  const out = Folder.of(outDir);
  const tsApiPath = out.makeFilePath("api.ts");
  const zodSchemasPath = out.makeFilePath("zod.ts");

  const project = new Project();
  project.addSourceFileAtPath(tsApiPath);
  project.addSourceFileAtPath(zodSchemasPath);

  const tsApi = project.getSourceFile(path.basename(tsApiPath));
  if (_.isNil(tsApi)) {
    throw `Error: Expected source file for provided path: srcFile: ${tsApiPath}, provided: ${outDir} `;
  }
  tsEnsureDiscriminatorValues(tsApi);

  const zodApi = project.getSourceFile(path.basename(zodSchemasPath));
  if (_.isNil(zodApi)) {
    throw `Error: Expected source file for provided path: srcFile: ${tsApiPath}, provided: ${outDir} `;
  }
  zodReplaceAnd(zodApi);
  zodEnsureUnknownEnumVariant(zodApi);

  project.saveSync();
  deleteUnwantedFiles(tsApiPath);
}

function zodEnsureUnknownEnumVariant(zodApi: SourceFile) {}
