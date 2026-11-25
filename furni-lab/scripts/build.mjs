// Une src/index.html con sus partes (marcadores /* @inline ruta */) en dist/index.html:
// una sola página autocontenida, sin dependencias.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "src/index.html"), "utf8")
  .replace(/\/\* @inline ([^*]+?) \*\//g, (_, file) => readFileSync(join(root, file.trim()), "utf8"));
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), html);
console.log(`dist/index.html (${(html.length / 1024).toFixed(1)} KB)`);
