import { SourceFile, SyntaxKind } from "ts-morph";
import { findMergeSignatureWithAnd } from "./ts-ensure-discriminator-values.js";

export function zodReplaceAnd(zodApi: SourceFile) {
  const mergeProperties = findMergeSignatureWithAnd(zodApi);
  mergeProperties.forEach((p) => {
    const identifier = p
      .getChildrenOfKind(SyntaxKind.Identifier)
      .filter((id) => id.getText() === "and");
    identifier.forEach((id) => {
      id.replaceWithText("merge");
    });
  });
}
