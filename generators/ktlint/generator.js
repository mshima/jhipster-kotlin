import os from 'node:os';
import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { isFileStateModified, isFileStateDeleted } from 'mem-fs-editor/state';
import { OutOfOrder } from 'p-transform';

export default class extends BaseApplicationGenerator {
    constructor(args, opts, features) {
        super(args, opts, {
            ...features,
            queueCommandTasks: true,
        });
    }

    get [BaseApplicationGenerator.DEFAULT]() {
        return this.asDefaultTaskGroup({
            async defaultTemplateTask() {
                if (!this.options.skipKtlintFormat) {
                    this.queueTransformStream(
                        {
                            name: 'formating using ktlint',
                            filter: file =>
                                isFileStateModified(file) &&
                                !isFileStateDeleted(file) &&
                                file.path.startsWith(this.destinationPath()) &&
                                file.path.endsWith('.kt'),
                            refresh: false,
                        },
                        new OutOfOrder(
                            async file => {
                                const ktlintFile = this.templatePath(`../resources/ktlint${os.platform() === 'win32' ? '.bat' : ''}`);
                                try {
                                    const { stdout } = await this.spawn(ktlintFile, ['--log-level=none', '--format', '--stdin'], {
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
