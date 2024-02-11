import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { render } from "./render-diagram.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = fastify({ logger: true });

app.register(fastifyStatic, {
  root: join(__dirname, ".."),
  prefix: "/public/", // optional: default '/',
  wildcard: false,
  list: {
    format: "json",
  },
});

app.get("/*", async (req, res) => {
  console.log("req: ", `public${req.url}`);
  await render();
  return res.sendFile(`public${req.url}`);
});

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;
app.listen({ port: PORT }, (err, address) => {
  if (err) {
    console.error(`Error starting server: ${address}`, err);
    process.exit(1);
  }
  console.log(`Server is running on http://localhost:${PORT}: ${address}`);
});
