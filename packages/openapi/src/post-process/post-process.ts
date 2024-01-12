import { Folder } from "../folder.js";
import { Project, SourceFile, SyntaxKind } from "ts-morph";
import path from "node:path";
import _ from "lodash";
import { tsEnsureDiscriminatorValues } from "./ts-ensure-discriminator-values.js";
import { zodReplaceAnd } from "./zod-replace-and.js";
import { deleteUnwantedFiles } from "./delete-unwanted-files.js";
import { OpenApiBundled } from "../bundle.js";
import { mergeAllOf } from "./merge-all-of.js";

export function postProcessSpec(bundled: OpenApiBundled) {
  return mergeAllOf(bundled);
}

/**
 * Processes resulting models
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

function zodEnsureUnknownEnumVariant(zodApi: SourceFile) {
  const enums = findEnums(zodApi);
  enums.forEach((p) => {
    p.replaceWithText(`${p.getText()}.or(UNKNOWN_SCHEMA)`);
  });
}

export function findEnums(api: SourceFile) {
  return api.getDescendantsOfKind(SyntaxKind.CallExpression).flatMap((n) => {
    // eslint-disable-next-line no-useless-escape
    const isEnumExpression = /\.enum\s*\([\[\]\s\w,_\-"']+\)\s*$/u.test(
      n.getText()
    );
    if (!isEnumExpression) {
      return [];
    }
    return [n];
  });
}
