import { basename, join } from 'path';
// Use spring-boot as parent due to this context in generators
import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { createNeedleCallback } from 'generator-jhipster/generators/base/support';

import { convertToKotlinFile } from '../kotlin/support/files.js';
import { KOTLIN_TEST_SRC_DIR } from './kotlin-constants.js';

export default class extends BaseApplicationGenerator {
    constructor(args, options, features) {
        super(args, options, {
            ...features,
            sbsBlueprint: true,
            jhipster7Migration: true,
            checkBlueprint: true,
            inheritTasks: true,
            queueCommandTasks: true,
        });
    }

    async _postConstruct() {
        await this.dependsOnJHipster('jhipster-kotlin:migration');
        // Use _postConstruct so kotlin will be queued before jhipster:spring-boot dependencies
        await this.dependsOnJHipster('jhipster:java:bootstrap');
        await this.dependsOnJHipster('jhipster-kotlin:kotlin');
    }

    async beforeQueue() {
        await this.dependsOnJHipster('jhipster-kotlin:ktlint');
    }

    get [BaseApplicationGenerator.COMPOSING]() {
        return this.asComposingTaskGroup({
            async composeDetekt() {
                await this.composeWithJHipster('jhipster-kotlin:detekt');
            },
            async composeSpringBootV2() {
                await this.composeWithJHipster('jhipster-kotlin:spring-boot-v2');
            },
        });
    }

    get [BaseApplicationGenerator.LOADING]() {
        return this.asLoadingTaskGroup({
            async applyKotlinDefaults({ application }) {
                Object.assign(application, {
                    // syncUserWithIdp disabled is not supported by kotlin blueprint
                    syncUserWithIdp: application.authenticationType === 'oauth2',
                });

                application.customizeTemplatePaths.unshift(
                    // Remove package-info.java files
                    file => (file.sourceFile.includes('package-info.java') ? undefined : file),
                    file => {
                        // Passthrough non liquibase files
                        if (!file.sourceFile.includes('src/main/resources/config/liquibase')) return file;
                        // Use master.xml from jhipster 7 templates
                        if (file.sourceFile.includes('master.xml')) return file.namespace === 'jhipster:liquibase' ? undefined : file;
                        // Use liquibase templates from liquibase generator
                        return file.namespace === 'jhipster:liquibase' ? file : undefined;
                    },
                    // Ignore files from generators
                    file =>
                        [
                            'jhipster:spring-boot',
                            'jhipster:spring-cloud:gateway',
                            'jhipster:spring-cloud-stream:kafka',
                            'jhipster:spring-cloud-stream:pulsar',
                        ].includes(file.namespace) && !file.sourceFile.includes('buildSrc')
                            ? undefined
                            : file,
                    // Kotling blueprint does not implements these files
                    file => {
                        const sourceBasename = basename(file.sourceFile);
                        return [
                            '_persistClass_Asserts.java',
                            '_persistClass_TestSamples.java',
                            'AssertUtils.java',
                            '_entityClass_Repository_r2dbc.java',
                            'ElasticsearchExceptionMapper.java',
                            'ElasticsearchExceptionMapperTest.java',
                            'QuerySyntaxException.java',
                            '_enumName_.java',
                            '_persistClass_.java.jhi.jackson_identity_info',
                            '_entityClass_GatlingTest.java',
                        ].includes(sourceBasename)
                            ? undefined
                            : file;
                    },
                    // Updated templates from v8
                    file => {
                        if (!['jhipster-kotlin:spring-boot-v2'].includes(file.namespace)) return file;
                        if (
                            // Use v8 files due to needles
                            file.sourceFile.includes('resources/logback') ||
                            // Updated gradle stack
                            file.sourceFile.endsWith('.gradle') ||
                            ['gradle.properties'].includes(basename(file.sourceFile))
                        ) {
                            return {
                                ...file,
                                resolvedSourceFile: this.fetchFromInstalledJHipster('server/templates/', file.sourceFile),
                            };
                        }
                        return file;
                    },
                    file => {
                        let { resolvedSourceFile, sourceFile, destinationFile, namespace } = file;
                        // Already resolved kotlin files
                        if (resolvedSourceFile.endsWith('.kt') || resolvedSourceFile.includes('.kt.')) {
                            return file;
                        }

                        if (
                            sourceFile.includes('.java') ||
                            // Use local files with updated jhipster 7 templates for these files
                            ['application-testprod.yml', 'application-testdev.yml'].includes(basename(file.sourceFile))
                        ) {
                            // Kotlint User template does not implements Persistable api. Ignore for now.
                            if (application.user && destinationFile.endsWith('UserCallback.java')) {
                                return undefined;
                            }

                            const sourceBasename = basename(sourceFile);
                            if (
                                file.namespace === 'jhipster:spring-data-relational' &&
                                ['UserSqlHelper_reactive.java', 'ColumnConverter_reactive.java', 'EntityManager_reactive.java'].includes(
                                    sourceBasename,
                                )
                            ) {
                                sourceFile = sourceFile.replace('_reactive', '');
                            }

                            const isCommonFile = filename => {
                                const sourceBasename = basename(filename);
                                if (['_entityClass_Repository.java', '_entityClass_Repository_reactive.java'].includes(sourceBasename)) {
                                    return file.namespace !== 'spring-data-couchbase';
                                }
                                return ['TestContainersSpringContextCustomizerFactory.java'].includes(sourceBasename);
                            };

                            // TestContainersSpringContextCustomizerFactory uses a single template for modularized (dbs) and non-modularized (kafka, etc) templates
                            if (sourceFile.endsWith('TestContainersSpringContextCustomizerFactory.java')) {
                                if (isCommonFile(sourceFile)) {
                                    // Use updated path
                                    sourceFile = sourceFile.replace('/package/', '/_package_/');
                                }
                                // Convert *TestContainersSpringContextCustomizerFactory to TestContainersSpringContextCustomizerFactory
                                const adjustTestContainersSpringContextCustomizerFactoryFile = filename =>
                                    filename.replace(
                                        /(\w*)TestContainersSpringContextCustomizerFactory.java/,
                                        'TestContainersSpringContextCustomizerFactory.java',
                                    );
                                sourceFile = adjustTestContainersSpringContextCustomizerFactoryFile(sourceFile);
                                destinationFile = adjustTestContainersSpringContextCustomizerFactoryFile(destinationFile);
                            }

                            sourceFile = sourceFile.replace('/java/package/', '/java/_package_/');
                            sourceFile =
                                file.namespace === 'jhipster-kotlin:spring-boot-v2' || isCommonFile(sourceFile)
                                    ? convertToKotlinFile(sourceFile)
                                    : join(namespace.split(':').pop(), convertToKotlinFile(sourceFile));

                            return {
                                ...file,
                                sourceFile,
                                javaResolvedSourceFile: resolvedSourceFile,
                                resolvedSourceFile: this.templatePath(sourceFile),
                                destinationFile: convertToKotlinFile(destinationFile),
                            };
                        }
                        return file;
                    },
                );
            },
        });
    }

    get [BaseApplicationGenerator.PREPARING]() {
        return this.asPreparingTaskGroup({
            blockhound({ application, source }) {
                source.addAllowBlockingCallsInside = ({ classPath, method }) => {
                    if (!application.reactive) throw new Error('Blockhound is only supported by reactive applications');

                    this.editFile(
                        `${KOTLIN_TEST_SRC_DIR}${application.packageFolder}config/JHipsterBlockHoundIntegration.kt`,
                        createNeedleCallback({
                            needle: 'blockhound-integration',
                            contentToAdd: `builder.allowBlockingCallsInside("${classPath}", "${method}")`,
                        }),
                    );
                };
            },
            async kotlinDefaults({ applicationDefaults }) {
                applicationDefaults({
                    __override__: true,
                    // Enabled by default if backendTypeJavaAny, apply for Kotlin as well
                    useNpmWrapper: ({ clientFrameworkAny }) => clientFrameworkAny,
                });
            },
            addCacheNeedles({ source, application }) {
                // Needle added in jhipster:spring-cache, delay to override it.
                this.delayTask(() => {
                    if (application.cacheProviderEhcache) {
                        const cacheConfigurationFile = `src/main/kotlin/${application.packageFolder}config/CacheConfiguration.kt`;
                        const needle = `${application.cacheProvider}-add-entry`;
                        const useJcacheConfiguration = application.cacheProviderRedis;
                        const addEntryToCacheCallback = entry =>
                            createNeedleCallback({
                                needle,
                                contentToAdd: `createCache(cm, ${entry}${useJcacheConfiguration ? ', jcacheConfiguration' : ''})`,
                            });

                        source.addEntryToCache = ({ entry }) => this.editFile(cacheConfigurationFile, addEntryToCacheCallback(entry));
                        source.addEntityToCache = ({ entityAbsoluteClass, relationships }) => {
                            const entry = `${entityAbsoluteClass}::class.java.name`;
                            this.editFile(
                                cacheConfigurationFile,
                                addEntryToCacheCallback(entry),
                                ...(relationships ?? [])
                                    .filter(rel => rel.collection)
                                    .map(rel => addEntryToCacheCallback(`${entry} + ".${rel.propertyName}"`)),
                            );
                        };
                    } else {
                        // Add noop
                        source.addEntryToCache = () => {};
                        // Add noop
                        source.addEntityToCache = () => {};
                    }
                });
            },
        });
    }

    get [BaseApplicationGenerator.LOADING_ENTITIES]() {
        return this.asLoadingEntitiesTaskGroup({
            migration({ application }) {
                if (application.authority) {
                    // V8 rest api is not compatible with current authority api.
                    application.authority.skipClient = true;
                }
            },
        });
    }

    get [BaseApplicationGenerator.POST_PREPARING_EACH_ENTITY]() {
        return this.asPostPreparingEachEntityTaskGroup({
            migration({ entity }) {
                // V7 templates expects false instead of 'no'
                entity.searchEngine = entity.searchEngine === 'no' ? false : entity.searchEngine;
                // V7 templates are not compatible with jpaMetamodelFiltering for reactive
                if (this.jhipsterConfig.reactive && entity.jpaMetamodelFiltering) {
                    entity.jpaMetamodelFiltering = false;
                }
            },
            prepareEntityForKotlin({ entity }) {
                const { primaryKey } = entity;
                if (primaryKey && primaryKey.name === 'id') {
                    // Kotlin does not support string ids specifications.
                    primaryKey.javaBuildSpecification = 'buildRangeSpecification';
                    for (const field of primaryKey.fields) {
                        field.fieldJavaBuildSpecification = 'buildRangeSpecification';
                    }
                }
            },
        });
    }

    get [BaseApplicationGenerator.POST_WRITING]() {
        return this.asPostWritingTaskGroup({
            async customizeMaven({ application, source }) {
                if (application.buildToolMaven) {
                    source.addMavenDefinition({
                        properties: [{ property: 'modernizer.failOnViolations', value: 'false' }],
                    });
                }
            },
        });
    }

    delayTask(method) {
        this.queueTask({
            method,
            taskName: `${this.runningState.methodName}(delayed)`,
            queueName: this.runningState.queueName,
        });
    }
}
