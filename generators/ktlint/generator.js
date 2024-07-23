import os from 'node:os';
import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
// import { OutOfOrder } from 'p-transform';
import { createKtlintTransform, filterKtlintTransformFiles } from './support/index.js';

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
                    const ktlintExecutable = this.templatePath(`../resources/ktlint${os.platform() === 'win32' ? '.bat' : ''}`);
                    this.queueTransformStream(
                        {
                            name: 'formating using ktlint',
                            filter: file => filterKtlintTransformFiles(file) && file.path.startsWith(destinationPath),
                            refresh: false,
                        },
                        createKtlintTransform.call(this, {
                            ktlintExecutable,
                            cwd: destinationPath,
                            ignoreErrors: control.ignoreNeedlesError,
                        }),
                        /*
                        new OutOfOrder(
                            async file => {
                                try {
                                    const { stdout } = await this.spawn(ktlintExecutable, ['--log-level=none', '--format', '--stdin'], {
                                        input: file.contents,
                                        stdio: 'pipe',
                                        shell: false,
                                        stripFinalNewline: false,
                                    });
                                    file.contents = Buffer.from(stdout);
                                } catch (error) {
                                    if (error.stdout) {
                                        file.contents = Buffer.from(error.stdout);
                                    } else {
                                        console.log(error);
                                    }
                                    if (error.stderr) {
                                        this.log.info('Error formatting file:', error.stderr);
                                    }
                                }
                                return file;
                            },
                            {
                                concurrency: 1 + Math.ceil(os.cpus().length / 2),
                            },
                        ).duplex(),
                        */
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
