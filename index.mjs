#!/usr/bin/env node

import glob from "tiny-glob";
import { parse, print, transformFile } from "@swc/core";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

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

const tsconfig = JSON.parse(await readFile("./tsconfig.json", "utf8"));

/**
 * @param {string} filename
 */
async function transform(filename) {
  const js = await transformFile(filename, {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: filename.endsWith(".tsx"),
      },
      target: "esnext",
      transform: {
        react: {
          runtime: "automatic",
          importSource: tsconfig.compilerOptions?.jsxImportSource || "react",
        },
      },
    },
  });

  const ast = await parse(js.code, {
    syntax: "ecmascript",
    target: "esnext",
  });

  for (const item of ast.body) {
    if (item.type === "ImportDeclaration") {
      const source = item.source.value;
      if (source.startsWith("./") || source.startsWith("../")) {
        if (source.endsWith(".ts")) {
          item.source.value = source.slice(0, -3) + ".mjs";
        } else if (source.endsWith(".tsx")) {
          item.source.value = source.slice(0, -4) + ".mjs";
        }
      }
      item.source.raw = JSON.stringify(item.source.value);
    }
  }

  const output = await print(ast);
  const outname =
    (filename.endsWith(".tsx")
      ? filename.slice(4, -4)
      : filename.slice(4, -3)) + ".mjs";
  return ["dist/esm/" + outname, output.code];
}

const tasks = await Promise.all(entryPoints.map(transform));

await rm("dist/esm", { recursive: true, force: true });
for (const [outname, code] of tasks) {
  await mkdir(dirname(outname), { recursive: true });
  await writeFile(outname, code);
}
