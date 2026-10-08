// ESLint (flat config) using Expo's shared rules. Run with: npm run lint
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Build output, old code and the tour script's own node_modules are not ours to lint.
    // supabase/functions is Deno code (checked with `deno check`, not ESLint).
    ignores: ['dist/*', 'dist-*/*', '_archive/*', 'scripts/tour/*', '.expo/*', 'node_modules/*', 'supabase/functions/*'],
  },
  {
    // Jest test files: the test helpers are globals.
    files: ['__tests__/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly', test: 'readonly', it: 'readonly', expect: 'readonly', jest: 'readonly',
        beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly',
      },
    },
  },
  {
    // Node helper scripts.
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', require: 'readonly', module: 'writable', process: 'readonly', console: 'readonly' },
    },
  },
]);
