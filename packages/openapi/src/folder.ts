import path from "path";
import process from "process";
import fs from "fs";
import {stringifyYaml} from "@redocly/openapi-core";

export function tempFolder() {
    const tmp = path.resolve(process.cwd(), "tmp")
    return folder(tmp)
}

export function folder(folderPath: string) {
    const absPath = path.isAbsolute(folderPath)
        ? folderPath
        : path.resolve(process.cwd(), folderPath);

    if (!fs.existsSync(absPath)) {
        fs.mkdirSync(absPath);
    }
    const _folder = fs.lstatSync(folderPath).isDirectory()
        ? folderPath
        : path.dirname(folderPath)

    return {
        write(fileName: string, content: string | object | NodeJS.ArrayBufferView) {
            fs.writeFileSync(this.makeFilePath(fileName), stringify(content))
            return this;
        },
        writeYml(fileName: string, content: string | object | NodeJS.ArrayBufferView) {
            const filePath = this.makeFilePath(fileName);
            fs.writeFileSync(this.makeFilePath(fileName), stringifyYaml(content))
            return filePath;
        },
        makeFilePath(file: string) {
            return path.isAbsolute(file) ? file : path.resolve(_folder, file);
        },
        delete(...files: string[]) {
            files.map(f => this.makeFilePath(f)).forEach(f => this.deleteFileOrDirectory(f))
            return this;
        },
        deleteFileOrDirectory(file: string) {
            if (!fs.existsSync(file)) {
                return this;
            }
            if (fs.lstatSync(file).isDirectory()) {
                fs.rmSync(file, {recursive: true});
                return this;
            }
            fs.rmSync(file);
            return this;
        },
        deleteAll() {
            if (fs.existsSync(_folder)) {
                fs.rmSync(_folder, {recursive: true, force: true})
            }
            return this;
        }
    }
}

function stringify(content: string | object | NodeJS.ArrayBufferView) {
    if (ArrayBuffer.isView(content)) {
        return content as NodeJS.ArrayBufferView
    }
    if (typeof content === 'object') {
        return JSON.stringify(content)
    }
    return content
}
