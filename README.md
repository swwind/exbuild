# `@swwind/exbuild`

A simple tool for build pure ESM TypeScript library.

## Get Start

Just install `@swwind/exbuild` and run `exbuild`.

This will compile all `src/**/*.{ts,tsx}` files into `dist/esm/**/*.mjs`.

## Types

If you want types also get generated, you may need to install `typescript` manually and run `tsc --build` with following example `tsconfig.json`.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist/types",
    "strict": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "resolveJsonModule": true,
    "lib": ["ESNext", "DOM"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

## Exports

You can edit your `package.json` to make your package **importable**.

```json
{
  "name": "example",
  "version": "0.0.1",
  "types": "./dist/types/index.d.ts",
  "module": "./dist/esm/index.mjs",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.mjs"
    },
    "./another/entry": {
      "types": "./dist/types/another/entry.d.ts",
      "import": "./dist/esm/another/entry.mjs"
    }
  }
}
```

Related entrance files should be placed at `src/index.ts` and `src/another/entry.ts`.
