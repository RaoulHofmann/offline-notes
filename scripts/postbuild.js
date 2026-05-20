import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const dist = resolve("dist");

const routes = ["/notes"];

for (const route of routes) {
  const dest = resolve(dist, route.replace(/^\//, ""), "index.html");
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(resolve(dist, "index.html"), dest);
}
