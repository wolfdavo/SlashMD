import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  target: 'node16',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  external: ['vscode'],
  noExternal: [],
  minify: false,
  splitting: false,
});