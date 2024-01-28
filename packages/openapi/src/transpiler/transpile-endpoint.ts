import { oas30 } from "openapi3-ts";
import { _ } from "@dsp/node-sdk";
import { TranspileContext } from "./transpile-context.js";

export interface Endpoint {
  deprecated: boolean;
  alias: string; // example: getPostComments, operationId
  method: "get" | "post" | "put" | "patch" | "delete";
  description?: string;
  path: string; // example: /posts/:postId/comments/:commentId
  parameters?: Array<Parameter>;
  requestBody?: RequestBody;
  responses: Array<ResponseObj>;
}

export module Endpoint {
  export function transpileAll(ctx: TranspileContext): Array<Endpoint> {
    return Object.entries(ctx.root.paths).flatMap(([path, pathItem]) => {
      const pathItemResolved = ctx.resolveRef(pathItem);
      if (_.isNil(pathItemResolved)) return [];
      return (["get", "put", "post", "delete", "patch"] as const)
        .flatMap((operationName) => (_.isDefined(pathItemResolved[operationName]) ? [{ ...pathItemResolved[operationName], method: operationName }] : []))
        .map(({ description, parameters, requestBody, operationId, responses, deprecated, method }) => {
          return {
            alias: operationId ?? "UNKNOWN_REQUIRED_ENDPOINT_NAME",
            deprecated: deprecated ?? false,
            path,
            description,
            method,
            responses: parseResponseBodies(responses, ctx),
            requestBody: parseRequestBody(requestBody, ctx),
            parameters: parseParameters(parameters, ctx),
          };
        });
    });
  }
}

const MemeType = {
  TEXT_HTML: "text/html",
  TEXT_PLAIN: "text/plain",
  MULTI_FORM_DATA: "multipart/form-data",
  APP_JSON: "application/json",
  APP_X_FORM: "application/x-www-form-urlencoded",
  APP_OCTET_STREAM: "application/octet-stream",
} as const;
type MemeType = (typeof MemeType)[keyof typeof MemeType];
type RawContentFormat =
  | {
      type: "KNOWN";
      format: MemeType;
    }
  | { type: "UNKNOWN"; format: string };
interface Content {
  format?: "json" | "form-data" | "form-url" | "binary" | "text";
  schema?: oas30.SchemaObject;
  rawFormat: RawContentFormat;
}
interface RequestBody extends Content {}
interface ResponseObj extends Content {
  status?: number;
  description?: string;
}
interface Parameter {
  name: string;
  description?: string;
  type: "path" | "query" | "cookie" | "header";
  /** @default type: string */
  schema: oas30.SchemaObject;
}
function parseParameters(parameters: Array<oas30.ParameterObject | oas30.ReferenceObject> | undefined, ctx: TranspileContext): Endpoint["parameters"] {
  return (
    parameters?.flatMap((p) => {
      const resolved = ctx.resolveRef(p);
      if (_.isNil(resolved) || _.isNil(resolved.schema)) return [];
      return [
        {
          type: resolved.in,
          schema: ctx.resolveRef(resolved.schema),
          name: resolved.name,
          description: resolved.description,
        },
      ];
    }) ?? []
  );
}

function parseRequestBody(requestBody: oas30.RequestBodyObject | oas30.ReferenceObject | undefined, ctx: TranspileContext): Endpoint["requestBody"] {
  const requestResolved = ctx.resolveRefOptional(requestBody);
  if (_.isNil(requestResolved)) return;
  const jsonContent = parseJsonFromContent(requestResolved.content, ctx);
  if (_.isNil(jsonContent)) return;
  return jsonContent satisfies Endpoint["requestBody"];
}

function parseResponseBodies(responses: oas30.ResponsesObject | undefined, ctx: TranspileContext): Endpoint["responses"] {
  if (_.isNil(responses)) return [];
  return Object.entries(_.omit(responses, "default"))
    .flatMap(([status, responseObj]) => {
      const responseResolved = ctx.resolveRef(responseObj);
      if (_.isNil(responseResolved)) return;
      const contents = parseContent(responseResolved.content, ctx);
      return (
        contents?.map(
          (content) =>
            ({
              ...content,
              status: _.isDefined(status) ? Number.parseInt(status) : undefined,
              description: responseResolved.description,
            } satisfies Endpoint["responses"][number])
        ) ?? []
      );
    })
    .filter(_.isDefined);
}

function parseContent(contentMap: oas30.ContentObject | undefined, ctx: TranspileContext): Array<Content> | undefined {
  if (_.isNil(contentMap)) return;
  return Object.entries(contentMap).map(([mediaType, mediaTypeObj]) => {
    // const format = Object.values(MemeType).find((d) => d === mediaType);
    const schema = ctx.resolveRefOptional(mediaTypeObj.schema);
    const contentType = parseContentType(mediaType);
    const format = contentType.type === "KNOWN" ? mapFormat(contentType.format) : undefined;
    if (_.isNil(format)) {
      return {
        format,
        rawFormat: contentType,
        schema,
      };
    }
    return {
      format,
      rawFormat: contentType,
      schema,
    };
  });
}

function parseJsonFromContent(contentMap: oas30.ContentObject | undefined, ctx: TranspileContext): (Content & { format: "json" }) | undefined {
  const requestContents = parseContent(contentMap, ctx);
  return requestContents?.find((d): d is Content & { format: "json" } => d.format === "json");
}

function parseContentType(mediaType: string): RawContentFormat {
  const format = Object.values(MemeType).find((d) => d === mediaType);
  if (_.isNil(format)) {
    return { type: "UNKNOWN", format: mediaType };
  }
  return { type: "KNOWN", format };
}
function mapFormat(_format: MemeType): RequestBody["format"] {
  switch (_format) {
    case "text/html":
    case "text/plain":
      return "text";
    case "application/json":
      return "json";
    case "multipart/form-data":
      return "form-data";
    case "application/x-www-form-urlencoded":
      return "form-url";
    case "application/octet-stream":
      return "binary";
  }
}
