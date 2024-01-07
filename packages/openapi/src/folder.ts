import path from "path";
import process from "process";
import fs from "fs";
import { stringifyYaml } from "@redocly/openapi-core";
import _ from "lodash";

export function tempFolder() {
  const tmp = path.resolve(process.cwd(), "tmp");
  return folder(tmp);
}
export module File {
  export function resolve(...segments: string[]) {
    return file(path.resolve(...segments));
  }
  export function of(filePath: string, nameWithExt?: string) {
    return file(filePath, nameWithExt);
  }
}

function file(filePath: string, nameWithExt?: string) {
  const fileName = isFilePath(filePath) ? path.basename(filePath) : nameWithExt;
  if (_.isNil(fileName)) {
    throw `Error: Expected file path to include fileName or a default but was given: path:${filePath}, nameWithExt: ${nameWithExt}`;
  }
  const _folder = folder(filePath);
  return {
    siblingFile(nameWithExt: string) {
      return _folder.makeFilePath(nameWithExt);
    },
    get absolutPath() {
      return _folder.makeFilePath(fileName);
    },
  };
}
function isFilePath(filePath: string) {
  return /\.\w+$/u.test(filePath);
}

function parseFolderPath(absPath: string) {
  if (!fs.existsSync(absPath)) {
    // this is not fail save but the best we can do atm to ensure folder
    return isFilePath(absPath) ? path.dirname(absPath) : absPath;
  }
  return fs.lstatSync(absPath).isDirectory() ? absPath : path.dirname(absPath);
}

export function folder(folderPath: string) {
  const absPath = path.isAbsolute(folderPath)
    ? folderPath
    : path.resolve(process.cwd(), folderPath);
  const _folder = parseFolderPath(absPath);
  if (!fs.existsSync(_folder)) {
    fs.mkdirSync(_folder, { recursive: true });
  }
  return {
    get absolutePath() {
      return absPath;
    },
    write(fileName: string, content: string | object | NodeJS.ArrayBufferView) {
      fs.writeFileSync(this.makeFilePath(fileName), stringify(content));
      return this;
    },
    writeYml(
      fileName: string,
      content: string | object | NodeJS.ArrayBufferView
    ) {
      const filePath = this.makeFilePath(fileName);
      fs.writeFileSync(this.makeFilePath(fileName), stringifyYaml(content));
      return filePath;
    },
    makeFilePath(file: string) {
      return path.isAbsolute(file) ? file : path.resolve(_folder, file);
    },
    delete(...files: string[]) {
      files
        .map((f) => this.makeFilePath(f))
        .forEach((f) => this.deleteFileOrDirectory(f));
      return this;
    },
    deleteFileOrDirectory(file: string) {
      if (!fs.existsSync(file)) {
        return this;
      }
      if (fs.lstatSync(file).isDirectory()) {
        fs.rmSync(file, { recursive: true });
        return this;
      }
      fs.rmSync(file);
      return this;
    },
    deleteAll() {
      if (fs.existsSync(_folder)) {
        fs.rmSync(_folder, { recursive: true, force: true });
      }
      return this;
    },
  };
}

function stringify(content: string | object | NodeJS.ArrayBufferView) {
  if (ArrayBuffer.isView(content)) {
    return content as NodeJS.ArrayBufferView;
  }
  if (typeof content === "object") {
    return JSON.stringify(content);
  }
  return content;
}
