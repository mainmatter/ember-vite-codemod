import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: process.env.TEST_TIMEOUT ?? 600_000,
  },
});
