import { extname } from 'path';
import { passthrough } from 'p-transform';
import { isFileStateDeleted, isFileStateModified } from 'mem-fs-editor/state';
import { Piscina } from 'piscina';

export const filterKtlintTransformFiles = file => isFileStateModified(file) && !isFileStateDeleted(file) && extname(file.path) === '.kt';

export const createKtlintTransform = function ({ ktlintExecutable, cwd, ignoreErrors } = {}) {
    const pool = new Piscina({
        filename: new URL('../internal/ktlint-worker.js', import.meta.url).href,
    });

    return passthrough(
        async file => {
            if (filterKtlintTransformFiles(file)) {
                if (file.contents) {
                    const fileContents = file.contents.toString('utf8');
                    const { result, error, info } = await pool.run({
                        ktlintExecutable,
                        cwd,
                        fileContents,
                    });
                    if (result) {
                        file.contents = Buffer.from(result);
                    }
                    if (info) {
                        this?.log?.info?.(info.replaceAll('<stdin>', file.relative));
                    }
                    if (error) {
                        if (ignoreErrors) {
                            this?.log?.warn?.(error);
                            return;
                        }

                        throw new Error(error);
                    }
                }
            }
        },
        () => {
            pool.destroy();
        },
    );
};
