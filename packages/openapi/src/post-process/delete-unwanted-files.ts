import { Folder } from "../folder.js";

export function deleteUnwantedFiles(apiPath: string) {
  Folder.of(apiPath).delete(
    "git_push.sh",
    ".gitignore",
    ".openapi-generator",
    ".npmignore",
    ".openapi-generator-ignore"
  );
}
