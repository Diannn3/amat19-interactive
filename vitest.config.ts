import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.vitest.ts'],
    environment: 'node'
  }
});
