/* eslint-disable no-inner-declarations */
import { oas30 } from "openapi3-ts";
import { OpenApiBundled } from "../bundle.js";
import { _ } from "@dsp/node-sdk";

import { SetRequired } from "type-fest";
import assert from "node:assert";
import { TranspileContext } from "./transpile-context.js";

export type OaComponent =
  | oas30.SchemaObject
  | oas30.ResponseObject
  | oas30.ParameterObject
  | oas30.ExampleObject
  | oas30.RequestBodyObject
  | oas30.HeaderObject
  | oas30.SecuritySchemeObject
  | oas30.CallbackObject
  | oas30.ISpecificationExtension;

export type ComponentNode = OaComponent | undefined | { [key: string]: ComponentNode };
type SchemaObjectFormat = "int32" | "int64" | "float" | "double" | "byte" | "binary" | "date" | "date-time" | "password" | (string & Record<never, never>);

export type Schema = Schema.OaObject | Schema.Union | Schema.Primitive | Schema.OaEnum | Schema.OaArray;
export module Schema {
  export interface Component {
    kind: "COMPONENT";
    id: string;
  }

  export interface Inline {
    kind: "INLINE";
    name: string;
  }

  interface Base {
    type: oas30.SchemaObjectType;
    raw: oas30.SchemaObject;
    component: Inline | Component;
  }

  interface PropertyBase extends Base {
    required: boolean;
    type: Exclude<oas30.SchemaObjectType, "object" | "null">;
    format: SchemaObjectFormat | undefined;
  }

  export interface OaObject extends Base {
    kind: "OBJECT";
    type: Extract<oas30.SchemaObjectType, "object">;
    /** Only one extended entity is allowed which must exists as a component otherwise we will merge */
    parent?: Schema.OaObject & { component: Component };
    properties: Array<Schema | DiscriminatorProperty>;
  }

  export interface Union extends Omit<Base, "type"> {
    raw: SetRequired<oas30.SchemaObject, "oneOf">;
    kind: "UNION";
    schemas: Array<Schema>;
  }

  type EnumOf<T extends Primitive["type"]> = T extends "string"
    ? T extends "number" | "integer"
      ? number
      : T extends "boolean"
      ? boolean
      : T extends "array"
      ? object
      : string
    : string;

  interface EnumLike<T extends Primitive["type"] = Primitive["type"]> {
    enum: Array<EnumOf<T>>;
  }

  export interface Primitive extends PropertyBase {
    type: Extract<oas30.SchemaObjectType, "string" | "number" | "integer" | "boolean">;
    kind: "PRIMITIVE";
  }

  export interface OaEnum extends PropertyBase, EnumLike {
    raw: oas30.SchemaObject & Pick<this, "type" | "enum">;
    kind: "ENUM";
  }

  export interface OaArray extends PropertyBase {
    raw: SetRequired<oas30.SchemaObject & Pick<this, "type">, "items">;
    type: Extract<oas30.SchemaObjectType, "array">;
    kind: "ARRAY";
    items: Schema;
  }

  export interface DiscriminatorProperty extends PropertyBase, EnumLike<"string"> {
    kind: "DISCRIMINATOR";
    /** entity wich requires this discriminator*/
    entityRef: Schema;
  }

  export function union(raw: oas30.SchemaObject & Union["raw"], component: Component | Inline, schemas: Union["schemas"]): Union {
    return {
      kind: "UNION",
      schemas,
      component,
      raw,
    };
  }

  export function oaObject(
    raw: oas30.SchemaObject & OaObject["raw"],
    component: Component | Inline,
    properties?: OaObject["properties"],
    parent?: OaObject["parent"]
  ): OaObject {
    return {
      type: raw.type !== "object" ? "object" : raw.type,
      properties: properties ?? [],
      kind: "OBJECT",
      parent,
      component,
      raw,
    };
  }

  export function oaEnum(
    raw: oas30.SchemaObject & OaEnum["raw"] & Pick<OaEnum, "type">,
    component: Component | Inline,
    values: OaEnum["enum"],
    params?: {
      required?: boolean;
    }
  ): OaEnum {
    return {
      type: raw.type,
      enum: values,
      required: params?.required ?? false,
      kind: "ENUM",
      format: raw.format,
      component,
      raw,
    };
  }

  export function primitive(
    raw: oas30.SchemaObject & Pick<Primitive, "type">,
    component: Component | Inline,
    params?: {
      required?: boolean;
    }
  ): Primitive {
    return {
      type: raw.type,
      required: params?.required ?? false,
      kind: "PRIMITIVE",
      format: raw.format,
      component,
      raw,
    };
  }

  export function oaArray(
    raw: oas30.SchemaObject & OaArray["raw"] & Pick<OaArray, "type">,
    component: Component | Inline,
    items: Schema,
    params?: {
      required?: boolean;
    }
  ): OaArray {
    return {
      type: raw.type,
      required: params?.required ?? false,
      kind: "ARRAY",
      items,
      format: raw.format,
      component,
      raw,
    };
  }

  export function isComponent(schema: oas30.SchemaObject): schema is oas30.SchemaObject & { "::ref": string } {
    return "::ref" in schema;
  }

  export function isPrimitiveJs(a: unknown): a is string | number | boolean | symbol {
    return ["string", "number", "boolean", "symbol"].includes(typeof a);
  }

  export function isPrimitiveOa(schema: oas30.SchemaObject): schema is oas30.SchemaObject & Pick<Primitive, "type"> {
    if (_.isNil(schema.type)) return false;
    assert(typeof schema.type === "string", `expected schema.type to be of type string but received: ${JSON.stringify(schema.type)}`);
    return ["integer", "number", "string", "boolean"].includes(schema.type);
  }

  export function isUnion(schema: oas30.SchemaObject): schema is Union["raw"] {
    return _.isDefined(schema.oneOf) && schema.oneOf.length > 0;
  }

  export function isOaArray(schema: oas30.SchemaObject): schema is OaArray["raw"] {
    if (_.isNil(schema.items)) return false;
    assert(schema.type === "array", `expected array schema to be of type 'array' but received '${JSON.stringify(schema.type)}': ${JSON.stringify(schema)}`);
    return _.isDefined(schema.items);
  }

  export function isOaObject(schema: oas30.SchemaObject): schema is OaObject["raw"] {
    return schema.type === "object" || _.isDefined(schema.properties);
  }

  export function isExtendedOaObject(schema: oas30.SchemaObject): schema is SetRequired<OaObject["raw"], "allOf"> {
    return _.isDefined(schema.allOf) && schema.allOf.filter((a) => !_.isEmpty(a)).length > 0;
  }

  export function isPrimitiveEnum(schema: oas30.SchemaObject): schema is Pick<OaEnum, "type" | "enum"> {
    if (_.isNil(schema.enum)) return false;
    assert(typeof schema.type === "string", `expected schema.type to be of type string but received: ${JSON.stringify(schema.type)}`);
    assert(isPrimitiveOa(schema), `expected enum schema to be a primitive type but received: ${JSON.stringify(schema.type)}`);
    assert(
      schema.enum?.every((e) => isPrimitiveJs(typeof e)),
      `expected enum array to only contain primitive types but received: ${JSON.stringify(schema)}`
    );
    return true;
  }

  export function ensureDiscriminator(schema: Schema, discriminatorValue: string, propertyName: string, unionSchema: Schema.Union): void {
    switch (schema.kind) {
      case "UNION":
        return schema.schemas.forEach((s) => ensureDiscriminator(s, discriminatorValue, propertyName, unionSchema));
      case "OBJECT": {
        const discriminator: DiscriminatorProperty = {
          entityRef: unionSchema,
          kind: "DISCRIMINATOR",
          component: { kind: "INLINE", name: propertyName },
          raw: { type: "string" },
          type: "string",
          enum: [discriminatorValue],
          required: true,
          format: undefined,
        };
        if (_.isNil(schema.properties)) {
          schema.properties = [discriminator];
          return;
        }
        const property = schema.properties.find((p) => p.component.kind === "INLINE" && p.component.name === propertyName);
        if (_.isNil(property)) {
          schema.properties.push(discriminator);
          return;
        }
        // todo: resolve weired typescript
        property.kind = "DISCRIMINATOR";
        if (property.kind === "DISCRIMINATOR") {
          property.required = true;
          // todo: how can property.enum be undefined??
          property.entityRef = unionSchema;
          property.enum = Array.from(new Set([...(property.enum ?? []), discriminatorValue]));
        }
        return;
      }
      case "PRIMITIVE":
      case "ENUM":
      case "ARRAY":
        throw new Error(`expected object sub schema to ensure discriminator properties and values but got: ${JSON.stringify(schema)}`);
    }
  }

  function transpileRecursive(schema: oas30.SchemaObject, name: string, ctx: TranspileContext): Schema {
    const component: Base["component"] = isComponent(schema) ? { kind: "COMPONENT", id: schema["::ref"] } : { kind: "INLINE", name };
    if (isPrimitiveEnum(schema)) {
      return oaEnum(schema, component, schema.enum);
    }

    if (isUnion(schema)) {
      // todo: implement discriminator
      const schemas: Union["schemas"] = schema.oneOf.map((s, idx) => parseSchema(`${name}_sub_${idx}`, s, ctx));
      const groupedSchemas = _.groupBy(schemas, (s) => (s.component.kind === "COMPONENT" ? s.component.id : s.component.name));
      const unionSchema = union(schema, component, schemas);
      Object.entries(schema.discriminator?.mapping ?? {}).forEach(([discriminatorValue, mapRef]) => {
        const subSchema = groupedSchemas[mapRef];
        assert(
          _.isDefined(subSchema),
          `expected discriminator mapping subschema to be a oneOf subschema ${discriminatorValue}, ${mapRef}: ${JSON.stringify(schema)}`
        );
        subSchema.forEach((s) => ensureDiscriminator(s, discriminatorValue, schema.discriminator!.propertyName, unionSchema));
      });
      // const discriminator = schema.discriminator.mapping
      return unionSchema;
    }

    if (isPrimitiveOa(schema)) {
      return primitive(schema, component);
    }

    if (isOaArray(schema)) {
      const itemSchema: OaArray["items"] = parseSchema(`${name}_item`, schema.items, ctx);
      return oaArray(schema, component, itemSchema);
    }

    if (isExtendedOaObject(schema)) {
      assert(
        schema.allOf.length <= 2,
        `transpiler currently only supports allOf.length of max 2. Consider pre-processing the specification with a bundler which supports merging allOf':  ${JSON.stringify(
          schema
        )}`
      );
      const allOfCleaned = schema.allOf.filter((e) => !_.isEmpty(e));
      const subSchemas = allOfCleaned.map((s, idx) => parseSchema(`${name}_sub_${idx}`, s, ctx));
      // todo: this is an issue/workaround for the bundler... it created an allOf with an empty array element for generic api
      if (subSchemas.length === 1) {
        const subSchema = subSchemas[0];
        subSchema.component = component.kind === "COMPONENT" ? component : subSchema.component;
        return subSchema;
      }

      const [parent, _schema] = subSchemas;
      assert(_schema.kind === "OBJECT", `expected subschema of extended schema to be of type object'${name}':  ${JSON.stringify(schema)}`);
      assert(
        parent.kind === "OBJECT" && parent.component.kind === "COMPONENT",
        `expected parent subschema of extended schema to be of a schema component '${name}':  ${JSON.stringify(schema)}`
      );
      // the schema may be a component which we split up here in child and parent. But we must ensure the component semantic for that schema.
      _schema.component = component.kind === "COMPONENT" ? component : _schema.component;
      // component needs to be defined to satisfy typescript - too nested
      _schema.parent = { ...parent, component: parent.component };
      return _schema;
    }

    if (isOaObject(schema)) {
      // todo: implement discriminator
      const properties: OaObject["properties"] = Object.entries(schema.properties ?? {}).map(([name, schema]) => parseSchema(name, schema, ctx));
      return oaObject(schema, component, properties);
    }
    throw new Error(`could not transpile schema '${name}':  ${JSON.stringify(schema)}`);
  }

  export function parseSchema(name: string, oa: oas30.SchemaObject | oas30.ReferenceObject, ctx: TranspileContext): Schema {
    const schema = ctx.resolveRefOptional(oa);

    if (ctx.schemas.has(schema)) {
      const cachedSchema = ctx.schemas.get(schema);
      assert(_.isDefined(cachedSchema), `expected to find cached transpiled schema for: ${JSON.stringify(schema)}`);
      return cachedSchema;
    }

    // assert invariants
    assert(_.isDefined(schema), `expected resolvable schema but received: ${JSON.stringify(oa)}`);
    if (_.isDefined(schema.type)) {
      assert(typeof schema.type === "string", `expected schema.type to be of type string but received: ${JSON.stringify(schema.type)}`);
    }
    assert(_.isNil(schema.anyOf), `schema.anyOf currently is not supported please migrate to oneOf: ${JSON.stringify(schema.type)}`);

    const transpiled = transpileRecursive(schema, name, ctx);
    ctx.schemas.set(oa, transpiled);
    return transpiled;
  }

  export function transpileAll(ctx: TranspileContext) {
    if (_.isNil(ctx.root.components?.schemas)) return;
    const schemas = Object.entries(ctx.root.components.schemas).map(([name, schema]) => {
      // eslint-disable-next-line
      (schema as any)["::ref"] = `#/components/schemas/${name}`;
      return parseSchema(name, schema, ctx);
    });
    console.log(schemas);
    return schemas;
  }
}
