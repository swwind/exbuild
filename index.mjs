#!/usr/bin/env node

import glob from "tiny-glob";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { transformFile } from "@swc/core";

/**
 * @param {string} filename
 * @returns
 */
function excludes(filename) {
  return /(?:[_\.](?:test|spec)|\.d)\.tsx?$/.test(filename);
}

const entryPoints = [
  ...(await glob("src/**/*.ts")),
  ...(await glob("src/**/*.tsx")),
].filter((x) => !excludes(x));

let tsconfig = null;

try {
  tsconfig = JSON.parse(await readFile("./tsconfig.json", "utf8"));
} catch {
  // ignore...
}

const adjustImportsWasm = fileURLToPath(
  new URL("./adjust_imports.wasm", import.meta.url)
);

/**
 * @param {string} filename
 */
async function build(filename) {
  const { code } = await transformFile(filename, {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: filename.endsWith(".tsx"),
        comments: true,
      },
      transform: {
        react: {
          runtime: "automatic",
          importSource: tsconfig?.compilerOptions?.jsxImportSource || "react",
        },
      },
      experimental: {
        plugins: [[adjustImportsWasm, {}]],
      },
      target: "esnext",
      preserveAllComments: true,
    },
    isModule: true,
    sourceMaps: "inline",
  });

  const outname =
    (filename.endsWith(".tsx")
      ? filename.slice(4, -4)
      : filename.slice(4, -3)) + ".mjs";
  return ["dist/esm/" + outname, code];
}

const tasks = await Promise.all(entryPoints.map(build));

await rm("dist/esm", { recursive: true, force: true });
for (const [outname, code] of tasks) {
  await mkdir(dirname(outname), { recursive: true });
  await writeFile(outname, code);
}
