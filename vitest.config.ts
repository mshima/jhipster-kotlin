import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        pool: 'forks',
        hookTimeout: 20000,
        exclude: [...defaultExclude.filter(val => val !== '**/cypress/**'), '**/templates/**', '**/resources/**'],
        setupFiles: ['./vitest.test-setup.ts'],
        env: {
            JHI_SKIP_GH_OUTPUT: true,
            GITHUB_OUTPUT: '/dev/null',
        },
    },
});
