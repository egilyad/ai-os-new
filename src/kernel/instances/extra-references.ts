import { lazyService } from '../service-helper';

export const promptSecurityService =
    lazyService<import('../contracts/prompt-security-types').IPromptSecurityService>(
        'promptSecurityService',
    );
