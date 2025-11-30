import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'participant-id': 'src/index.ts',
  },
  format: ['cjs', 'esm', 'iife'],
  globalName: 'ParticipantIdLib',
  dts: true,
  clean: true,
})
