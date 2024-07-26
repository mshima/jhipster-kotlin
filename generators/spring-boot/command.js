import { command as springBootCommand } from 'generator-jhipster/generators/spring-boot';

/**
 * @type {import('generator-jhipster').JHipsterCommandDefinition}
 */
const command = {
    ...springBootCommand,
    configs: {
        ...springBootCommand.configs,
    },
    import: ['jhipster-kotlin:ktlint'],
    compose: ['jhipster-kotlin:detekt'],
};

export default command;
