import { Folder } from "@dsp/node-sdk";

export function deleteUnwantedFiles(apiPath: string) {
  Folder.of(apiPath).delete(
    "git_push.sh",
    ".gitignore",
    ".openapi-generator",
    ".npmignore",
    ".openapi-generator-ignore"
  );
}
