import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // A forgotten .only must fail the run instead of silently skipping the other tests.
    allowOnly: false,
  },
})
