import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import BaseApplicationGenerator from 'generator-jhipster/generators/spring-boot';
import { getEnumInfo } from 'generator-jhipster/generators/base-application/support';
import { files as entityServerFiles } from 'jhipster-7-templates/esm/generators/entity-server';
import { files as serverFiles } from 'jhipster-7-templates/esm/generators/server';
import { migrateApplicationTask } from './preparing-migration.js';
import migration from './migration.cjs';

const { jhipsterConstants } = migration;
const { MAIN_DIR } = jhipsterConstants;
const SERVER_MAIN_SRC_KOTLIN_DIR = `${MAIN_DIR}kotlin/`;

const jhipster7TemplatesPackage = dirname(fileURLToPath(import.meta.resolve('jhipster-7-templates/package.json')));

export default class extends BaseApplicationGenerator {
    constructor(args, options, features) {
        super(args, options, { ...features, jhipster7Migration: true });

        this.jhipsterTemplatesFolders = [
            this.templatePath(''),
            join(jhipster7TemplatesPackage, 'generators/server/templates/'),
            join(jhipster7TemplatesPackage, 'generators/entity-server/templates/'),
        ];
    }

    get [BaseApplicationGenerator.PREPARING]() {
        return this.asPreparingTaskGroup({
            migrateApplicationTask,
        });
    }

    get [BaseApplicationGenerator.DEFAULT]() {
        return this.asDefaultTaskGroup({
            migration({ application }) {
                Object.assign(application, {
                    serviceDiscoveryType: application.serviceDiscoveryType === 'no' ? false : application.serviceDiscoveryType,
                });
            },
        });
    }

    get [BaseApplicationGenerator.WRITING]() {
        return this.asWritingTaskGroup({
            async writeFiles({ application }) {
                await this.writeFiles({
                    sections: serverFiles,
                    context: application,
                    customizeTemplatePath: file => {
                        const { sourceFile } = file;
                        // Use docker-compose files from docker generator
                        if (
                            sourceFile.includes('src/main/docker') &&
                            !sourceFile.includes('src/main/docker/jhipster-control-center.yml') &&
                            !sourceFile.includes('src/main/docker/jib') &&
                            !sourceFile.includes('src/main/docker/grafana') &&
                            !sourceFile.includes('src/main/docker/monitoring.yml')
                        ) {
                            return undefined;
                        }

                        // Use wrappers scripts from maven/gradle generators
                        if (file.sourceFile.includes('.mvnw') || file.sourceFile.includes('gradle/wrapper/')) {
                            return undefined;
                        }

                        const sourceBasename = basename(sourceFile);

                        // Ignore files migrated to modularized templates
                        return [
                            // jhipster:java:node
                            'npmw',
                            'npmw.cmd',
                            // jhipster:maven
                            'maven-wrapper.jar',
                            'maven-wrapper.properties',
                            'mvnw',
                            'mvnw.cmd',
                            // jhipster:gradle
                            'gradlew',
                            'gradlew.bat',
                            // jhipster:java:docker
                            'entrypoint.sh',
                            // jhipster:spring-data-couchbase
                            'DatabaseConfiguration_couchbase.java',
                            // jhipster:spring-data-cassandra
                            'DatabaseConfiguration_cassandra.java',
                            'EmbeddedCassandra.java',
                            'CassandraTestContainer.java',
                            'CassandraKeyspaceIT.java',
                            // jhipster:spring-data-mongodb
                            'DatabaseConfiguration_mongodb.java',
                            'EmbeddedMongo.java',
                            'MongoDbTestContainer.java',
                            'InitialSetupMigration.java',
                            // jhipster:spring-data-neo4j
                            'DatabaseConfiguration_neo4j.java',
                            'EmbeddedNeo4j.java',
                            'Neo4jTestContainer.java',
                            'Neo4jMigrations.java',
                            // jhipster:spring-data-elasticsearch
                            'ElasticsearchConfiguration.java',
                            'EmbeddedElasticsearch.java',
                            'ElasticsearchTestContainer.java',
                            'ElasticsearchTestConfiguration.java',
                            'UserSearchRepository.java',
                            // jhipster:spring-data-relational
                            'DatabaseConfiguration_sql.java',
                            // jhipster:cucumber
                            'CucumberIT.java',
                            'StepDefs.java',
                            'UserStepDefs.java',
                            'CucumberTestContextConfiguration.java',
                            'user.feature',
                            'gitkeep',
                            // jhipster:spring-cache
                            'CacheConfiguration.java',
                            'CacheFactoryConfiguration.java',
                            'EmbeddedRedis.java',
                            'RedisTestContainer.java',
                            // jhipster:spring-websocket
                            'WebsocketConfiguration.java',
                            'WebsocketSecurityConfiguration.java',
                            'ActivityService.java',
                            'ActivityDTO.java',
                            // jhipster:java:jib
                            'docker.gradle',
                            // jhipster:java:code-quality
                            'sonar.gradle',
                            // jhipster:java:openapi-generator v7.6.1
                            // 'swagger.gradle',
                        ].includes(sourceBasename)
                            ? undefined
                            : file;
                    },
                });
            },
        });
    }

    get [BaseApplicationGenerator.WRITING_ENTITIES]() {
        return this.asWritingEntitiesTaskGroup({
            async writingEntitiesTemplateTask({ application, entities }) {
                for (const entity of entities.filter(entity => !entity.skipServer && !entity.builtInUser && !entity.builtInAuthority)) {
                    await this.writeFiles({
                        sections: entityServerFiles,
                        context: { ...application, ...entity, entity },
                        rootTemplatesPath: application.reactive ? ['reactive', ''] : [''],
                        customizeTemplatePath: file => {
                            const sourceBasename = basename(file.sourceFile);
                            // Files migrated to modularized templates
                            return [
                                'EntityTest.java',
                                'EntityRepository.java',
                                'EntityRepository_reactive.java',
                                'EntityRowMapper.java',
                                'EntitySqlHelper_reactive.java',
                                'EntityRepositoryInternalImpl_reactive.java',
                                'EntityCallback.java',
                                'EntitySqlHelper_reactive.java',
                                'EntityRepositoryWithBagRelationships.java',
                                'EntityRepositoryWithBagRelationshipsImpl.java',
                                'EntityRepositoryInternalImpl_reactive.java',
                                'EntitySearchRepository.java',
                            ].includes(sourceBasename) || sourceBasename.startsWith('Entity.java.jhi')
                                ? undefined
                                : file;
                        },
                    });
                }
            },

            // Can be dropped for jhipster 8.7.0
            async writeEnumFiles({ application, entities }) {
                for (const entity of entities.filter(entity => !entity.skipServer)) {
                    for (const field of entity.fields.filter(field => field.fieldIsEnum)) {
                        const enumInfo = {
                            ...application,
                            ...getEnumInfo(field, entity.clientRootFolder),
                            frontendAppName: entity.frontendAppName,
                            packageName: application.packageName,
                            javaPackageSrcDir: application.javaPackageSrcDir,
                            entityJavaPackageFolder: entity.entityJavaPackageFolder,
                            entityAbsolutePackage: entity.entityAbsolutePackage || application.packageName,
                        };
                        await this.writeFiles({
                            blocks: [
                                {
                                    templates: [
                                        {
                                            file: `${SERVER_MAIN_SRC_KOTLIN_DIR}_package_/domain/enumeration/Enum.kt`,
                                            renameTo: () =>
                                                `${SERVER_MAIN_SRC_KOTLIN_DIR}${entity.entityAbsoluteFolder}/domain/enumeration/${field.fieldType}.kt`,
                                        },
                                    ],
                                },
                            ],
                            context: enumInfo,
                        });
                    }
                }
            },
        });
    }

    get [BaseApplicationGenerator.POST_WRITING]() {
        return this.asPostWritingTaskGroup({
            async jhipsterV7Dependencies({ application, source }) {
                source.addJavaDefinition({
                    dependencies: [
                        { groupId: 'io.dropwizard.metrics', artifactId: 'metrics-core' },
                        { groupId: 'org.zalando', artifactId: `problem-spring-${application.reactive ? 'webflux' : 'web'}` },
                        {
                            groupId: 'tech.jhipster',
                            artifactId: 'jhipster-dependencies',
                            version: application.jhipsterDependenciesVersion,
                            type: 'pom',
                            scope: 'import',
                        },
                    ],
                });

                if (application.authenticationTypeJwt) {
                    source.addJavaDefinition({
                        dependencies: [
                            { groupId: 'io.jsonwebtoken', artifactId: 'jjwt-api' },
                            { groupId: 'io.jsonwebtoken', artifactId: 'jjwt-impl', scope: 'runtime' },
                            { groupId: 'io.jsonwebtoken', artifactId: 'jjwt-jackson', scope: 'compile' },
                        ],
                    });
                } else if (application.authenticationTypeOauth2) {
                    source.addJavaDefinition({
                        dependencies: [{ groupId: 'org.springframework.boot', artifactId: 'spring-boot-starter-oauth2-resource-server' }],
                    });
                }

                if (application.applicationTypeGateway || application.applicationTypeMicroservice) {
                    source.addJavaDefinition({
                        dependencies: [{ groupId: 'org.springframework.cloud', artifactId: 'spring-cloud-starter-openfeign' }],
                    });
                }
                if (application.databaseTypeMongodb) {
                    source.addJavaDefinition({
                        dependencies: [
                            { groupId: 'org.mongodb', artifactId: 'mongodb-driver-sync' },
                            ...(application.reactive ? [{ groupId: 'org.mongodb', artifactId: 'mongodb-driver-reactivestreams' }] : []),
                        ],
                    });
                }
                if (application.databaseTypeCassandra) {
                    source.addJavaDefinition({
                        dependencies: [{ groupId: 'org.cassandraunit', artifactId: 'cassandra-unit-spring' }],
                    });
                }
                if (application.databaseTypeSql && application.reactive) {
                    source.addJavaDefinition({
                        dependencies: [{ groupId: 'org.apache.commons', artifactId: 'commons-collections4' }],
                    });
                }
            },
            customizeGradle({ application, source }) {
                if (application.buildToolGradle) {
                    source.addGradleProperty({ property: 'mapstructVersion', value: application.javaDependencies.mapstruct });
                    source.addGradleProperty({ property: 'springBootVersion', value: application.javaDependencies['spring-boot'] });
                    if (application.databaseTypeSql) {
                        source.addGradleProperty({ property: 'liquibase.version', value: application.javaDependencies.liquibase });
                        source.addGradleProperty({ property: 'hibernateVersion', value: application.javaDependencies.hibernate });
                        source.addGradleProperty({ property: 'jaxbRuntimeVersion', value: '4.0.0' });
                    }
                    if (application.databaseTypeCassandra) {
                        source.addGradleProperty({ property: 'cassandraDriverVersion', value: '4.14.1' });
                    }
                    source.addGradleDependencies([{ groupId: 'tech.jhipster', artifactId: 'jhipster-framework', scope: 'implementation' }]);
                }
            },
            async customizeMaven({ application, source }) {
                if (application.buildToolMaven) {
                    source.addMavenDefinition({
                        properties: [
                            { property: 'modernizer-maven-plugin.version', value: application.javaDependencies['modernizer-maven-plugin'] },
                            { property: 'spring-boot.version', value: application.javaDependencies['spring-boot'] },
                        ],
                        dependencies: [
                            {
                                groupId: 'tech.jhipster',
                                artifactId: 'jhipster-framework',
                                additionalContent: application.reactive
                                    ? `
            <exclusions>
                <exclusion>
                    <groupId>org.springframework</groupId>
                    <artifactId>spring-webmvc</artifactId>
                </exclusion>
            </exclusions>`
                                    : '',
                            },
                        ],
                    });

                    if (application.databaseTypeSql) {
                        source.addMavenDefinition({
                            properties: [
                                { property: 'jaxb-runtime.version', value: '4.0.0' },
                                { property: 'liquibase-hibernate5.version', value: application.javaDependencies.liquibase },
                                { property: 'liquibase.version', value: application.javaDependencies.liquibase },
                                { property: 'hibernate.version', value: application.javaDependencies.hibernate },
                            ],
                        });
                    }
                }
            },
        });
    }
}
