import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";

await mkdir("dist", { recursive: true });

await build({
  entryPoints: ["src/Code.ts"],
  outfile: "dist/Code.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2019",
  logLevel: "info",
  legalComments: "none",
  treeShaking: false
});

const bundledCode = await readFile("dist/Code.js", "utf8");
const flattenedCode = bundledCode
  .replace(/^"use strict";\n\(\(\) => \{\n/, '"use strict";\n')
  .replace(/\n\}\)\(\);\s*$/, "\n");

await writeFile("dist/Code.js", flattenedCode);

await cp("src/appsscript.json", "dist/appsscript.json");
