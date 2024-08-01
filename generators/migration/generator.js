import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { passthrough } from '@yeoman/transform';

export default class extends BaseApplicationGenerator {
    get [BaseApplicationGenerator.PREPARING]() {
        return this.asPreparingTaskGroup({
            async source({ source }) {
                this.delayTask(() => {
                    source.addAllowBlockingCallsInside = () => undefined;
                    source.addApplicationPropertiesContent = () => undefined;
                    source.addIntegrationTestAnnotation = () => undefined;
                    source.addTestSpringFactory = () => undefined;
                });
            },
        });
    }

     get [BaseApplicationGenerator.DEFAULT]() {
        return this.asDefaultTaskGroup({
            async defaultTask({ application }) {
                this.queueTransformStream(
                        {
                            name: 'updating gradle files',
                            filter: file => file.path.endsWith('.gradle') || file.path.endsWith('pom.xml'),
                            refresh: false,
                        },
                        passthrough(file => {
                            file.contents = Buffer.from(
                                file.contents
                                    .toString()
                                    .replace('micrometer-registry-prometheus-simpleclient', 'micrometer-registry-prometheus')
                            .replaceAll('jakarta.', 'javax.')
                            .replaceAll('spring-cloud-stream-test-binder', 'spring-cloud-stream-test-support')
                            .replaceAll('org.hibernate.orm', 'org.hibernate')
                            .replaceAll('mongock-springboot-v3', 'mongock-springboot')
                            .replaceAll('mongodb-springdata-v4-driver', 'mongodb-springdata-v3-driver')
                            .replaceAll('jackson-datatype-hibernate6', 'jackson-datatype-hibernate5')
                            .replaceAll('org.apache.cassandra', 'com.datastax.oss')
                            .replaceAll('<classifier>jakarta</classifier>', ''),
                            );
                        }),
                    );
                
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

                this.delayTask(() => {
                    if (application.buildToolMaven) {
                        this.editFile('pom.xml', content =>
                            content
                                .replace('<useSpringBoot3>true</useSpringBoot3>', '')
                                .replace(
                                    '<skipValidateSpec>false</skipValidateSpec>',
                                    '<importMappings>Problem=org.zalando.problem.Problem</importMappings><skipValidateSpec>false</skipValidateSpec>',
                                ),
                        );
                    } else if (application.buildToolGradle && application.databaseTypeSql && application.cacheProviderAny) {
                        this.editFile('buildSrc/src/main/groovy/jhipster.spring-cache-conventions.gradle', content =>
                            content.replace('hibernate-jcache', 'hibernate-jcache:${hibernateVersion}'),
                        );
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
