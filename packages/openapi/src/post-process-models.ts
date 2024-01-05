/* eslint-disable @typescript-eslint/no-unused-vars */
import {Project, SourceFile, StructureKind, SyntaxKind} from "ts-morph";
import _ from 'lodash'
import * as path from "node:path";
import * as fs from "fs";
import * as process from "process";
import {folder} from "./folder.js"

/**
 * Add discriminator values on oneOf interfaces
 * @param filePath File containing all ts interfaces
 */
export function postProcessModels(filePath: string) {
    const apiPath = fs.lstatSync(filePath).isDirectory()
        ? path.isAbsolute(filePath)
            ? path.resolve(filePath, "api.ts")
            : path.resolve(process.cwd(), "api.ts")
        : filePath

    const project = new Project();
    project.addSourceFileAtPath(apiPath)
    const api = project.getSourceFile(path.basename(apiPath))!;
    ensureDiscriminatorValues(api);
    project.saveSync()

    folder(apiPath).delete("git_push.sh", ".gitignore", ".openapi-generator", ".npmignore", ".openapi-generator-ignore")
    // remove
}

function ensureDiscriminatorValues(api: SourceFile) {
    const discriminatedUnions = findDiscriminatedUnions(api)
    const interfaces = api.getChildrenOfKind(SyntaxKind.InterfaceDeclaration);
    discriminatedUnions.forEach(({node, discriminator}) => {
        const {subTypes, mappingValues, propertyName} = discriminator;
        return subTypes?.map((sub, idx) => {
            const unionName = node.getNameNode().getText();
            if(_.isNil(subTypes) || _.isNil(mappingValues) || subTypes.length !== mappingValues?.length){
                throw `Error: Expected discriminated union ${unionName} to have mappings for all subtypes but found: subTypes: ${JSON.stringify(subTypes)}, mappings: ${JSON.stringify(mappingValues)}`;
            }
            const mappingValue = mappingValues.at(idx);
            const subType = interfaces.find(i => i.getNameNode().getText() === sub);
            if(_.isNil(mappingValue) || _.isNil(subType) || _.isNil(propertyName)){
                throw `Error: Could not resolve discriminator mapping for union '${unionName}' and discriminatorProperty '${propertyName ?? "UNKNOWN"}' : ${JSON.stringify(mappingValue)}, mappings: ${JSON.stringify(subType)}`;
            }

            const discriminatorProperty = subType.getProperty(propertyName)
            // ensure discriminatorProperty
            if (_.isNil(discriminatorProperty)) {
                subType.addProperty({
                    name: propertyName!,
                    kind: StructureKind.PropertySignature,
                    type: `'${mappingValue}'` ?? "string"
                })
                return subType;
            }
            const propertyValue = discriminatorProperty.getType();
            // ensure allowed discriminator on unsupported type - only literal or union types expected
            if (!propertyValue.isLiteral() && !propertyValue.isUnion()) {
                discriminatorProperty.setType(`'${mappingValue}'`)
                console.log(`fixed missing discriminator value on subtype ${subType}.${propertyName} - setting it with ${mappingValue}`)
            }
            // make union if allowed value literal does not match it
            else if (propertyValue.isLiteral() && propertyValue.getLiteralValue() !== mappingValue) {
                discriminatorProperty.setType(`'${propertyValue.getLiteralValue()}' | '${mappingValue}'`)
                console.log(`fixed missing discriminator value on subtype ${subType}.${propertyName} - extending ${propertyValue.getText()} with ${mappingValue}`)
            }
            // add allowed discriminator to union value if not present
            else if (!propertyValue.getUnionTypes().some(u => u.getLiteralValue() === mappingValue)) {
                const unions = propertyValue.getUnionTypes().map(u => u.getText())
                unions.push(`'${mappingValue}'`);
                const newType = unions.join(" | ")
                discriminatorProperty.setType(newType)
                console.log(`fixed missing discriminator value on subtype ${subType}.${propertyName} - extending ${JSON.stringify(unions)} with ${mappingValue}`)
            }
            return subType;
        })
    })
}

function findDiscriminatedUnions(api: SourceFile) {
    return api.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration).flatMap(n => {
        const tags = n.getJsDocs().flatMap(d => d.getTags())
        const isDiscriminatedUnion = tags.some(t => t.getTagNameNode().getText() === "discriminatedUnion");
        if (!isDiscriminatedUnion) {
            return [];
        }
        const propertyName = tags.find(t => t.getTagNameNode().getText() === "discriminatorProperty")?.getCommentText();
        const mappingValues = tags.find(t => t.getTagNameNode().getText() === "discriminatorValues")?.getCommentText();
        const subTypes = tags.find(t => t.getTagNameNode().getText() === "subTypes")?.getCommentText();
        return isDiscriminatedUnion ? [{
            node: n,
            discriminator: {
                propertyName,
                mappingValues: parseUnionFromJsDoc(mappingValues),
                subTypes: parseUnionFromJsDoc(subTypes)
            }
        }] : [];
    });
}

function isDefined<T>(v: T | undefined): v is NonNullable<T> {
    return !_.isNil(v)
}

function parseUnionFromJsDoc(mappingValues: string | undefined) {
    return mappingValues?.split("|").filter(isDefined).map(_.trim);
}
