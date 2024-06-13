import { expect } from 'expect';
import { skipPrettierHelpers as helpers } from './utils/utils.mjs';

import { applicationTypes, authenticationTypes, cacheTypes, buildToolTypes, databaseTypes } from '../generators/jdl.mjs';

const { JWT, OAUTH2 } = authenticationTypes;
const { GATEWAY, MICROSERVICE } = applicationTypes;
const { CAFFEINE, EHCACHE } = cacheTypes;
const { SQL, H2_MEMORY, POSTGRESQL } = databaseTypes;
const { MAVEN } = buildToolTypes;

describe('JHipster server generator', () => {
    describe('generate server with ehcache', () => {
        let runResult;
        before(async () => {
            runResult = await helpers
                .create('jhipster:app')
                .withOptions({
                    withGeneratedFlag: true,
                    blueprints: 'kotlin',
                    'from-cli': true,
                    skipInstall: true,
                    skipChecks: true,
                    'skip-ktlint-format': true,
                    skipClient: true,
                })
                .withPrompts({
                    baseName: 'jhipster',
                    packageName: 'com.mycompany.myapp',
                    packageFolder: 'com/mycompany/myapp',
                    serviceDiscoveryType: false,
                    authenticationType: JWT,
                    cacheProvider: EHCACHE,
                    enableHibernateCache: true,
                    databaseType: SQL,
                    devDatabaseType: H2_MEMORY,
                    prodDatabaseType: POSTGRESQL,
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr'],
                    buildTool: MAVEN,
                    rememberMeKey: '5c37379956bd1242f5636c8cb322c2966ad81277',
                    serverSideOptions: [],
                })
                .run();
        });

        it('creates expected files for default configuration for server generator', () => {
            expect(runResult.getStateSnapshot()).toMatchSnapshot();
        });
    });
    describe('generate server with caffeine', () => {
        let runResult;
        before(async () => {
            runResult = await helpers
                .create('jhipster:app')
                .withOptions({
                    withGeneratedFlag: true,
                    blueprints: 'kotlin',
                    'from-cli': true,
                    skipInstall: true,
                    skipChecks: true,
                    'skip-ktlint-format': true,
                    skipClient: true,
                })
                .withPrompts({
                    baseName: 'jhipster',
                    packageName: 'com.mycompany.myapp',
                    packageFolder: 'com/mycompany/myapp',
                    serviceDiscoveryType: false,
                    authenticationType: JWT,
                    cacheProvider: CAFFEINE,
                    enableHibernateCache: true,
                    databaseType: SQL,
                    devDatabaseType: H2_MEMORY,
                    prodDatabaseType: POSTGRESQL,
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr'],
                    buildTool: MAVEN,
                    rememberMeKey: '5c37379956bd1242f5636c8cb322c2966ad81277',
                    serverSideOptions: [],
                })
                .run();
        });

        it('creates expected files for caffeine cache configuration for server generator', () => {
            expect(runResult.getStateSnapshot()).toMatchSnapshot();
        });
    });
    describe('microfrontend', () => {
        let runResult;
        before(async () => {
            runResult = await helpers
                .create('jhipster:app')
                .withOptions({
                    withGeneratedFlag: true,
                    blueprints: 'kotlin',
                    'from-cli': true,
                    skipInstall: true,
                    skipChecks: true,
                    'skip-ktlint-format': true,
                    skipClient: true,
                    applicationType: MICROSERVICE,
                })
                .withPrompts({
                    baseName: 'jhipster',
                    skipInstall: true,
                    auth: OAUTH2,
                    microfrontend: true,
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr', 'en'],
                    withGeneratedFlag: true,
                })
                .run();
        });
        it('should match generated files snapshot', () => {
            expect(runResult.getStateSnapshot()).toMatchSnapshot();
        });
    });
    describe('gateway application type', () => {
        describe('with non reactive option', () => {
            let runResult;
            before(async () => {
                runResult = await helpers
                    .create('jhipster:app')
                    .withOptions({
                        blueprints: 'kotlin',
                        defaults: true,
                        reactive: false,
                        applicationType: GATEWAY,
                        'skip-ktlint-format': true,
                    })
                    .run();
            });
            it('should convert to reactive', () => {
                runResult.assertJsonFileContent('.yo-rc.json', {
                    'generator-jhipster': { reactive: true, applicationType: GATEWAY },
                });
            });
        });
    });
});
