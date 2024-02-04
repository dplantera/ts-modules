/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import {OpenApiBundled} from "../../bundle.js";
import {Transpiler} from "../../transpiler/index.js";
import {Schema} from "../../transpiler/transpile-schema.js";
import assert from "node:assert";
import {Project, ScriptKind, ts} from "ts-morph";
import DiscriminatorProperty = Schema.DiscriminatorProperty;
import {pascalCase} from "pascal-case";
import * as camelcase from "camelcase";
import {_, File, Folder} from "@dsp/node-sdk";
import {log} from "../../logger.js";
import Handlebars from "handlebars";

import url from "url";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));
const TEMPLATE_DIR = "../../../templates";

interface GenCtx {
}

export async function generateZod(parsed: OpenApiBundled, filePath: string) {
    const transpiler = Transpiler.of(parsed);
    const schemas = transpiler.schemasTopoSorted();
    const components = schemas.filter((s) => s.component.kind === "COMPONENT");
    // we want to generate all components
    const imports = ["import { z } from 'zod'", "import * as zc from './zod-common.js'"];
    const schemaDeclarations = components.map((c) => createConstantDeclaration(c, {useBigIntForLongNumberInt64: true}));
    const typeDeclarations = components.map((c) => createTypeDeclaration(c, {useBigIntForLongNumberInt64: true}));
    const schemaTypesModule = createModule("Types", typeDeclarations, {});
    schemaDeclarations.push(schemaTypesModule);
    const schemasModule = createModule("Schemas", schemaDeclarations, {});
    const source = [...imports, schemasModule].join("\n");
    const sourceSchema = createTsMorphSrcFile(filePath, source);

    /* hint: just checking hbs out, could easily laso be*/
    const templateDir = Folder.resolve(dirname, TEMPLATE_DIR);
    const commonTemplate = templateDir.makeFile("zod-common.hbs").readAsString();
    const template = Handlebars.compile(commonTemplate);
    const result = template({});
    File.of(filePath).siblingFile("zod-common.ts").write(result);
    return sourceSchema;
}

function createConstantDeclaration(c: Schema, options: GenCtx) {
    const declaration = `export const ${pascalCase(c.getName())}`;
    const value = processSchema(c, options);
    return `${declaration} = ${value};`;
}

function createTypeDeclaration(c: Schema, options: GenCtx) {
    const declaration = `export type ${pascalCase(c.getName())}`;
    const value = Factory.createInferredType(c, options);
    return `${declaration} = ${value};`;
}

function createModule(name: string, members: string[], options: GenCtx) {
    return `
export module ${name} {
    ${members.join("\n")}
}
  `;
}

function processSubSchema(c: Schema | DiscriminatorProperty, options: GenCtx) {
    switch (c.component.kind) {
        case "INLINE":
            return Factory.withOptional(c.required, () => processSchema(c, options));
        case "COMPONENT":
            return Factory.createEntityRef(c, options);
    }
}

function processSchema(c: Schema | DiscriminatorProperty, options: GenCtx): string {
    switch (c.kind) {
        case "UNION": {
            if (_.isDefined(c.discriminator)) {
                // transform for zod schema factory
                const mappings = c.discriminator.mappings.map((d) => ({discriminatorValue:  Factory.stringify(d.discriminatorValue), entityRef: Factory.createEntityRef(d, options)}))
                return Factory.createDiscriminatedUnion(c.discriminator!.name, mappings, options);
            }
            const subSchemas = c.schemas.map((s) => processSubSchema(s, options));
            return Factory.createUnion(c, subSchemas, options);
        }
        case "OBJECT": {
            const parent = _.isDefined(c.parent) ? processSubSchema(c.parent, options) : undefined;
            const properties = c.properties.map((s) => {
                const name = camelcase.default(s.getName());
                const value = processSubSchema(s, options);
                return Factory.createObjectProperty(name, value, options);
            });
            return Factory.createObject(properties, parent, options);
        }
        case "PRIMITIVE": {
            const primitive = Factory.createPrimitive(c, options);
            return Factory.withConstraintsAware(c, primitive, options);
        }
        case "ENUM": {
            return Factory.createEnum(c, c.enum, options);
        }
        case "ARRAY": {
            const item = processSubSchema(c.items, options);
            const arr = Factory.createArray(c, item, options);
            return Factory.withConstraintsAware(c, arr, options);
        }
        case "DISCRIMINATOR": {
            return Factory.createDiscriminator(c, c.enum, options);
        }
    }
}

function createTsMorphSrcFile(tsFilePath: string, source: string) {
    const project = new Project();
    const sourceFile = project.createSourceFile(tsFilePath, source, {
        overwrite: true,
        scriptKind: ScriptKind.TS,
    });
    sourceFile.formatText({
        indentSwitchCase: true,
        indentStyle: ts.IndentStyle.Smart,
        indentMultiLineObjectLiteralBeginningOnBlankLine: true,
    });
    sourceFile.saveSync();
    return {project, sourceFile: sourceFile};
}

module Factory {
    const valueConstraints = [
        "maximum",
        "exclusiveMaximum",
        "minimum",
        "exclusiveMinimum",
        "maxLength",
        "minLength",
        "pattern",
        "maxItems",
        "minItems",
        "uniqueItems",
        "maxProperties",
        "minProperties",
    ] as const;
    type Constraints<K extends keyof Schema["raw"] & (typeof valueConstraints)[number] = keyof Schema["raw"] & (typeof valueConstraints)[number]> = Pick<
        Schema["raw"],
        K
    >;

    export function createInferredType(c: Schema | DiscriminatorProperty, options: GenCtx) {
        return `z.infer<typeof Schemas.${createEntityRef(c, options)}>`;
    }

    export function createEntityRef(c: Schema | DiscriminatorProperty, options: GenCtx) {
        return `${pascalCase(c.getName())}`;
    }

    export function withOptional(required: boolean, fn: () => string): string {
        return required ? fn() : `${fn()}.optional()`;
    }

    export function withPassthrough(fn: () => string): string {
        return `${fn()}.passthrough()`;
    }

    export function createUnion(c: Schema.Union, subSchemas: string[], options: GenCtx): string {
        return `z.union([${subSchemas.join(", ")}])`;
    }

    export function createDiscriminatedUnion(discriminatorProperty: string, mappings: Array<{ discriminatorValue: string; entityRef: string }>, options: GenCtx): string {
        const matchProperties = mappings.map(p => createObjectProperty(p.discriminatorValue, p.entityRef, options))
        // add unknown schema
        matchProperties.push(`onDefault: z.object({ ${discriminatorProperty}: z.string().brand("UNKNOWN") })`);
        return withPassthrough(() => `zc.ZodUnionMatch.matcher("${discriminatorProperty}", ${createObjectTs(matchProperties, options)})`);
    }

    export function createObjectProperty(name: string, value: string, options: GenCtx): string {
        return `${name}: ${value}`;
    }

    export function createObject(properties: string[], parent: string | undefined, options: GenCtx): string {
        const obj = `z.object(${createObjectTs(properties, options)})`;
        return _.isDefined(parent) ? `${parent}.merge(${obj})` : obj;
    }

    export function createObjectTs(properties: string[], options: GenCtx): string {
        return `{${properties.join(", ")}}`;
    }

    export function createPrimitive(c: Schema.Primitive, options: GenCtx): string {
        switch (c.type) {
            case "integer":
                return `z.number().int()`;
            case "number":
                return numberFormatAware(c, `z.number()`, options);
            case "string":
                return stringFormatAware(c, `z.string()`, options);
            case "boolean":
                return `z.boolean()`;
        }
    }

    export function createEnum(c: Schema.OaEnum, values: string[], options: GenCtx): string {
        function withUnknownVariant(value: string) {
            return `${value}.or(z.string().brand("UNKNOWN"))`;
        }

        return withUnknownVariant(`z.enum([${values.map(stringify).join(",")}])`);
    }

    export function createArray(c: Schema.OaArray, item: string, options: GenCtx): string {
        return `z.array(${item})`;
    }

    export function createDiscriminator(c: Schema.DiscriminatorProperty, values: string[], options: GenCtx): string {
        if (values.length <= 1) {
            return literal(values[0]);
        }
        // todo: implement discrimintated union
        return `z.enum([${values.map(stringify).join(",")}])`;
    }

    export function literal(value: string) {
        return `z.literal(${stringify(value)})`;
    }

    export function withConstraintsAware(schema: Schema, value: string, options: GenCtx) {
        const constraints: Constraints = schema.raw;
        const isExclusiveMin = constraints.exclusiveMinimum;
        const isExclusiveMax = constraints.exclusiveMaximum;
        return Object.entries(_.omit(constraints, "exclusiveMinimum", "exclusiveMaximum")).reduce((acc, param) => {
            const [curr, val] = param as [keyof Omit<Constraints, "exclusiveMinimum" | "exclusiveMaximum">, number];
            switch (curr) {
                case "maximum": {
                    return isExclusiveMax ? `${value}.refine((n) => n < ${val}, { message: "Value must be less than ${val}" })` : `${value}.max(${val})`;
                }
                case "minimum": {
                    return isExclusiveMin ? `${value}.refine((n) => n > ${val}, { message: "Value must be greater than ${val}" })` : `${value}.min(${val})`;
                }
                case "pattern":
                    return `${value}.regex(/${val}/)`;
                case "maxLength":
                case "maxItems":
                    return `${value}.max(${val})`;
                case "minLength":
                case "minItems":
                    return `${value}.min(${val})`;
                case "uniqueItems":
                case "maxProperties":
                case "minProperties":
                    // not supported
                    log.info(`unsupported constraint ${curr} will be ignored`);
                    break;
            }
            return acc;
        }, value);
    }

    export function stringFormatAware(c: Schema.Primitive, numberValue: string, options: GenCtx): string {
        switch (c.format) {
            case "int64":
                // todo: feat: support bigint for string + int64 format
                return numberValue;
            case "int32":
            case "float":
            case "double":
            case "byte":
            case "binary":
            case "password":
                // no known requirements
                return numberValue;
            case "date":
                // todo: feat: handle date validation and parsing but be aware parsing a date string may be ambiguous when time information are included due to the js-Date object may include server time which may result in a diffrent day
                // todo: feat: include option to validate iso date
                // todo: feat: express date format for typescript on type level
                // Requirement: Date String MUST be parseable by js Date
                // Requirement: Date String MUST not include time information. When parsing date, time information MUST be stripped away.
                return numberValue;
            case "date-time":
                // Requirement: DateTime String MUST be parseable by js Date
                // Requirement: DateTime String MUST include timezone information
                // in js a number can be unambiguously parsed with the date object. Decimals may be ignored
                return numberValue;
            case undefined:
            default:
                // no known requirements for  vendor prefixed formats
                return numberValue;
        }
    }

    export function numberFormatAware(c: Schema.Primitive, numberValue: string, options: GenCtx): string {
        switch (c.format) {
            case "int64":
            case "int32":
                // we can ensure integer at runtime
                return `${numberValue}.int()`;
            case "float":
            case "double":
                // its just number
                return numberValue;
            case "byte":
            case "binary":
            case "password":
                // no known requirements
                return numberValue;
            case "date":
            case "date-time":
                // in js a number can be unambiguously parsed with the date object. Decimals may be ignored
                return numberValue;
            case undefined:
            default:
                // no known requirements for  vendor prefixed formats
                return numberValue;
        }
    }

    export function stringify(value: string | number) {
        return `'${value}'`;
    }
}
