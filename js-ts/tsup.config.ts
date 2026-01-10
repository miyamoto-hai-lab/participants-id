import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'browser-id': 'src/browser-id.ts',
  },
  format: ['cjs', 'esm', 'iife'],
  globalName: 'BrowserIdLib',
  dts: true,
  clean: true,
})
