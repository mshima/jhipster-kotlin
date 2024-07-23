import { execa } from 'execa';

export default async ({ ktlintExecutable, fileContents, cwd }) => {
    let result;
    let info;
    try {
        const { stdout } = await execa(ktlintExecutable, ['--log-level=none', '--format', '--stdin'], {
            input: fileContents,
            stdio: 'pipe',
            shell: false,
            stripFinalNewline: false,
            cwd,
        });
        result = stdout;
    } catch (error) {
        if (error.stdout) {
            result = error.stdout;
        } else {
            console.log(error);
        }
        if (error.stderr) {
            info = error.stderr;
        } else {
            return { error: `${error}` };
        }
    }
    return { result, info };
};
