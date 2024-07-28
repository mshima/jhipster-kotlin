import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { createNeedleCallback } from 'generator-jhipster/generators/base/support';
import { passthrough } from '@yeoman/transform';

export default class extends BaseApplicationGenerator {
    async beforeQueue() {
        await this.dependsOnJHipster('jhipster:java:build-tool');
    }

    get [BaseApplicationGenerator.PREPARING]() {
        return this.asPreparingTaskGroup({
            async source({ application, source }) {
                if (application.buildToolGradle) {
                    // Add a noop needles for spring-gateway generator
                    source.addJavaDefinition = () => {};
                    source.addJavaDependencies = () => {};

                    // JHipster 7 does not support buildScript add for migration
                    source.addGradlePluginToBuildScript = ({ group, name, version }) => {
                        this.editFile(
                            'build.gradle',
                            createNeedleCallback({
                                needle: 'gradle-buildscript-dependency',
                                contentToAdd: `classpath "${group}:${name}:${version}"`,
                            }),
                        );
                    };
                }
            },
        });
    }

    get [BaseApplicationGenerator.DEFAULT]() {
        return this.asDefaultTaskGroup({
            async defaultTask({ application }) {
                if (application.buildToolGradle) {
                    this.queueTransformStream(
                        {
                            name: 'updating gradle files',
                            filter: file => file.path.endsWith('.gradle'),
                            refresh: false,
                        },
                        passthrough(file => {
                            file.contents = Buffer.from(
                                file.contents
                                    .toString()
                                    .replaceAll(/reportOn (.*)/g, 'testResults.from($1)')
                                    .replaceAll('destinationDir =', 'destinationDirectory =')
                                    .replaceAll('html.enabled =', 'html.required =')
                                    .replaceAll('xml.enabled =', 'xml.required =')
                                    .replaceAll('csv.enabled =', 'csv.required ='),
                            );
                        }),
                    );
                }
            },
        });
    }

    get [BaseApplicationGenerator.POST_WRITING]() {
        return this.asPostWritingTaskGroup({
            removeScripts({ application }) {
                if (application.applicationTypeGateway || application.gatewayServerPort) {
                    // Readiness port is not correctly exposed in gateways
                    // Don't wait for readiness state
                    const scriptsStorage = this.packageJson.createStorage('scripts');
                    scriptsStorage.delete('pree2e:headless');
                }
            },
            async postWritingTemplateTask({ application }) {
                if (application.buildToolGradle) {
                    // JHipster 8 have needles fixed
                    this.editFile('build.gradle', contents => contents.replaceAll('//jhipster', '// jhipster'));
                    if (application.databaseTypeSql) {
                        this.editFile('build.gradle', contents =>
                            contents.replace(
                                '\nconfigurations {',
                                '\nconfigurations {\n    liquibaseRuntime.extendsFrom sourceSets.main.compileClasspath\n',
                            ),
                        );
                        this.editFile('gradle.properties', contents =>
                            contents.replace('liquibasePluginVersion=2.1.1', 'liquibasePluginVersion=2.2.2'),
                        );
                    }
                    this.editFile('settings.gradle', contents => contents.replaceAll('//jhipster', '// jhipster'));
                }
            },
        });
    }
}
