/* eslint-disable no-inner-declarations */
import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import { stringifyYaml } from "@redocly/openapi-core";
import { _ } from "@dsp/ts-sdk";

export module File {
  export function isFilePath(filePath: string) {
    return /\.\w+$/u.test(filePath);
  }

  export function resolve(...segments: string[]) {
    return of(path.resolve(...segments));
  }
  export function of(filePath: string, nameWithExt?: string) {
    const fileName = isFilePath(filePath)
      ? path.basename(filePath)
      : nameWithExt;
    if (_.isNil(fileName)) {
      throw `Error: Expected file path to include fileName or a default but was given: path:${filePath}, nameWithExt: ${nameWithExt}`;
    }
    const _folder = Folder.of(filePath);
    return {
      siblingFile(nameWithExt: string) {
        return _folder.makeFilePath(nameWithExt);
      },
      get absolutPath() {
        return _folder.makeFilePath(fileName);
      },
    };
  }
  export function stringify(content: string | object | NodeJS.ArrayBufferView) {
    if (ArrayBuffer.isView(content)) {
      return content as NodeJS.ArrayBufferView;
    }
    if (typeof content === "object") {
      return JSON.stringify(content);
    }
    return content;
  }
}

export module Folder {
  export function temp() {
    return resolve(process.cwd(), "tmp");
  }
  export function resolve(...segments: string[]) {
    return of(path.resolve(...segments));
  }
  export function of(folderPath: string) {
    const absPath = path.isAbsolute(folderPath)
      ? folderPath
      : path.resolve(process.cwd(), folderPath);
    const _folder = parsePath(absPath);
    if (!fs.existsSync(_folder)) {
      fs.mkdirSync(_folder, { recursive: true });
    }
    return {
      get absolutePath() {
        return absPath;
      },
      write(
        fileName: string,
        content: string | object | NodeJS.ArrayBufferView
      ) {
        fs.writeFileSync(this.makeFilePath(fileName), File.stringify(content));
        return this;
      },
      appendSync(
        fileName: string,
        content: string | object | NodeJS.ArrayBufferView
      ) {
        fs.appendFileSync(
          this.makeFilePath(fileName),
          JSON.stringify(content) + "\n"
        );
        return this;
      },
      writeYml(
        fileName: string,
        content: string | object | NodeJS.ArrayBufferView
      ) {
        const filePath = this.makeFilePath(fileName);
        fs.writeFileSync(
          this.makeFilePath(fileName),
          stringifyYaml(content, { noRefs: true })
        );
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
      readAllFilesAsString(): Array<{ src: string; content: string }> {
        return fs
          .readdirSync(_folder)
          .map(this.makeFilePath.bind(this))
          .filter(isFile)
          .map((f: string) => ({
            src: f,
            content: fs.readFileSync(f, "utf-8"),
          }));
      },
      deleteFileOrDirectory(file: string) {
        if (!fs.existsSync(file)) {
          return this;
        }
        if (isDir(file)) {
          fs.rmSync(file, { recursive: true });
          return this;
        }
        fs.rmSync(file);
        return this;
      },
      clear() {
        if (fs.existsSync(_folder)) {
          fs.rmSync(_folder, { recursive: true, force: true });
        }
        return this;
      },
    };
  }

  export function isDir(path: string): boolean {
    return fs.lstatSync(path).isDirectory();
  }

  export function isFile(path: string): boolean {
    return fs.lstatSync(path).isFile();
  }

  export function parsePath(absPath: string): string {
    if (!fs.existsSync(absPath)) {
      // this is not fail save but the best we can do atm to ensure folder
      return File.isFilePath(absPath) ? path.dirname(absPath) : absPath;
    }
    return isDir(absPath) ? absPath : path.dirname(absPath);
  }
}
