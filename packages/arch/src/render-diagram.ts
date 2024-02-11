import { run } from "@mermaid-js/mermaid-cli";

export async function render() {
  await run(
    "diagrams/c4/test.mmd",
    "public/test.svg" // {optional options},
  );
}
