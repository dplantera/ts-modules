import { run } from "@mermaid-js/mermaid-cli";

await run(
  "diagrams/c4/test.mmd",
  "public/test.svg" // {optional options},
);
