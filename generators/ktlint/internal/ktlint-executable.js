import { platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getKtlintExecutable = () => join(__dirname, `../resources/ktlint${platform() === 'win32' ? '.bat' : ''}`);
