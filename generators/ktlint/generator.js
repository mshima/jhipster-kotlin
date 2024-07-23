import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { createKtlintTransform, filterKtlintTransformFiles } from './internal/ktlint-transform.js';

export default class extends BaseApplicationGenerator {
    constructor(args, opts, features) {
        super(args, opts, {
            ...features,
            queueCommandTasks: true,
        });
    }

    get [BaseApplicationGenerator.DEFAULT]() {
        return this.asDefaultTaskGroup({
            async defaultTemplateTask({ control }) {
                if (!this.options.skipKtlintFormat) {
                    const destinationPath = this.destinationPath();
                    this.queueTransformStream(
                        {
                            name: 'formating using ktlint',
                            filter: file => filterKtlintTransformFiles(file) && file.path.startsWith(destinationPath),
                            refresh: false,
                        },
                        createKtlintTransform.call(this, {
                            cwd: destinationPath,
                            ignoreErrors: control.ignoreNeedlesError,
                        }),
                    );
                }
            },
        });
    }

    get [BaseApplicationGenerator.POST_WRITING]() {
        return this.asPostWritingTaskGroup({
            async postWriting({ application }) {
                const command = application.buildToolGradle ? './gradlew :ktlintFormat' : './mvnw ktlint:format';
                this.packageJson.merge({
                    scripts: {
                        'ktlint:format': command,
                    },
                });
            },
        });
    }
}
