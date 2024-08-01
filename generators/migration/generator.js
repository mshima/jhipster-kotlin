import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { passthrough } from '@yeoman/transform';

export default class extends BaseApplicationGenerator {
    get [BaseApplicationGenerator.PREPARING]() {
        return this.asPreparingTaskGroup({
            async source({ application, source }) {
                this.delayTask(() => {
                    source.addAllowBlockingCallsInside = () => undefined;
                    source.addApplicationPropertiesContent = () => undefined;
                    source.addIntegrationTestAnnotation = () => undefined;
                    source.addTestSpringFactory = () => undefined;

                    if (application.buildToolGradle) {
                        // Add a noop needles for spring-gateway generator
                        source.addJavaDefinition = () => {};
                        source.addJavaDependencies = () => {};
                    }
                });
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
                this.editFile('src/main/resources/logback-spring.xml', contents => contents.replaceAll('jakarta.', 'javax.'));
                this.editFile('src/test/resources/logback.xml', contents => contents.replaceAll('jakarta.', 'javax.'));

                if (application.buildToolGradle) {
                    // JHipster 8 have needles fixed
                    this.editFile('build.gradle', contents => contents.replaceAll('//jhipster', '// jhipster'));
                    this.editFile('settings.gradle', contents => contents.replaceAll('//jhipster', '// jhipster'));
                }
                this.delayTask(() => {
                    this.editFile(application.buildToolGradle ? 'build.gradle' : 'pom.xml', content =>
                        content
                            .replace('micrometer-registry-prometheus-simpleclient', 'micrometer-registry-prometheus')
                            .replaceAll('jakarta.', 'javax.')
                            .replaceAll('spring-cloud-stream-test-binder', 'spring-cloud-stream-test-support')
                            .replaceAll('org.hibernate.orm', 'org.hibernate')
                            // .replaceAll('org.mongock', 'io.mongodb')
                            .replaceAll('mongock-springboot-v3', 'mongock-springboot')
                            .replaceAll('mongodb-springdata-v4-driver', 'mongodb-springdata-v3-driver')
                            .replaceAll('jackson-datatype-hibernate6', 'jackson-datatype-hibernate5')
                            .replaceAll('<classifier>jakarta</classifier>', ''),
                    );
                    if (application.buildToolMaven) {
                        this.editFile('pom.xml', content =>
                            content
                                .replaceAll(
                                    /<groupId>(org.mongodb)<\/groupId>((.*)<artifactId>mongodb-driver-sync<\/artifactId>)/g,
                                    '<groupId>$1</groupId>$2',
                                )
                                .replaceAll(
                                    /<groupId>(org.mongodb)<\/groupId>((.*)<artifactId>mongodb-driver-reactivestreams<\/artifactId>)/g,
                                    '<groupId>$1</groupId>$2',
                                )
                                .replace('<useSpringBoot3>true</useSpringBoot3>', '')
                                .replace(
                                    '<skipValidateSpec>false</skipValidateSpec>',
                                    '<importMappings>Problem=org.zalando.problem.Problem</importMappings><skipValidateSpec>false</skipValidateSpec>',
                                ),
                        );
                    }
                    if (application.buildToolGradle) {
                        if (application.databaseTypeSql) {
                            const { javaDependencies } = application;
                            this.editFile('build.gradle', contents =>
                                contents
                                    // .replace('org.mongodb:mongodb-driver-sync', 'io.mongodb:mongodb-driver-sync')
                                    // .replace('org.mongodb:mongodb-driver-reactivestreams', 'io.mongodb:mongodb-driver-reactivestreams')
                                    .replace(
                                        '\nconfigurations {',
                                        '\nconfigurations {\n    liquibaseRuntime.extendsFrom sourceSets.main.compileClasspath\n',
                                    ),
                            );
                            this.editFile('gradle.properties', contents =>
                                contents
                                    .replace(/liquibasePluginVersion=(.*)/, 'liquibasePluginVersion=2.2.2')
                                    .replace(/(checkstyleVersion)=(.*)/, `$1=${javaDependencies.checkstyle}`)
                                    .replace(/(noHttpCheckstyleVersion)=(.*)/, `$1=${javaDependencies['nohttp-checkstyle']}`),
                            );
                        }
                    }
                });
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
