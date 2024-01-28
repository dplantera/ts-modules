import { SpecResolver } from "../../spec-resolver.js";
import { OpenApiBundled } from "../../bundle.js";

export async function generateZod(parsed: OpenApiBundled) {
  return SpecResolver.findSchemaObjectsWith(parsed, () => true);
}
