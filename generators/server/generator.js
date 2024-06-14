import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';

export default class extends BaseApplicationGenerator {
    constructor(args, opts, features) {
        super(args, opts, { ...features, sbsBlueprint: true });
    }

    get [BaseApplicationGenerator.INITIALIZING]() {
        return this.asInitializingTaskGroup({
            async initializingTemplateTask() {
                await this.parseCurrentJHipsterCommand();
            },
        });
    }

    get [BaseApplicationGenerator.CONFIGURING]() {
        return this.asConfiguringTaskGroup({
            async configuringTemplateTask() {
                this.jhipsterConfig.backendType = 'kotlin';
            },
        });
    }

    get [BaseApplicationGenerator.COMPOSING]() {
        return this.asComposingTaskGroup({
            async composingTemplateTask() {
                await this.composeWithJHipster('jhipster-kotlin:kotlin');
            },
        });
    }
}
