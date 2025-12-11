import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'participants-id': 'src/participants-id.ts',
  },
  format: ['cjs', 'esm', 'iife'],
  globalName: 'ParticipantsIdLib',
  dts: true,
  clean: true,
})
