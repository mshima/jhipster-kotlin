import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

describe('SubGenerator kotlin of kotlin JHipster blueprint', () => {
    describe('run', () => {
        beforeAll(async function () {
            await helpers
                .run('jhipster:spring-boot')
                .withJHipsterConfig()
                .withOptions({
                    ignoreNeedlesError: true,
                    blueprints: 'kotlin',
                })
                .withJHipsterLookup()
                .withParentBlueprintLookup()
                .withMockedGenerators(['jhipster-kotlin:ktlint']);
        });

        it('should succeed', () => {
            expect(result.getStateSnapshot()).toMatchSnapshot();
        });
    });
});
