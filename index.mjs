#!/usr/bin/env node

import esbuild from "esbuild";
import glob from "tiny-glob";

/**
 * @param {string} filename
 * @returns
 */
function isTest(filename) {
  return (
    filename.endsWith(".test.ts") ||
    filename.endsWith(".test.tsx") ||
    filename.endsWith(".spec.ts") ||
    filename.endsWith(".spec.tsx")
  );
}

const entryPoints = [
  ...(await glob("src/**/*.ts")),
  ...(await glob("src/**/*.tsx")),
].filter((x) => !isTest(x));

await esbuild.build({
  entryPoints,
  format: "esm",
  outdir: "dist/esm",
  platform: "node",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  plugins: [
    {
      name: "add-mjs",
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.importer) {
            if (args.path.endsWith(".ts"))
              return { path: args.path.slice(0, -3) + ".mjs", external: true };
            if (args.path.endsWith(".tsx"))
              return { path: args.path.slice(0, -4) + ".mjs", external: true };
            return { external: true };
          }
        });
      },
    },
  ],
});
