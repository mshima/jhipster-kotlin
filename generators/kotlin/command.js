import { command as springBootCommand } from 'generator-jhipster/generators/spring-boot';

const { defaultPackaging } = springBootCommand.configs;

/**
 * @type {import('generator-jhipster').JHipsterCommandDefinition}
 */
const command = {
    options: {},
    configs: {
        defaultPackaging,
        skipKtlintFormat: {
            cli: {
                desc: 'Skip ktlintFormat',
                type: Boolean,
            },
            scope: 'generator',
        },
    },
    arguments: {},
};

export default command;
