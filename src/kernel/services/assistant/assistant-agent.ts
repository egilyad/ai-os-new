/**
 * The project assistant as a first-class agent.
 *
 * The assistant is not a chat window bolted onto the side of the system: it
 * lives in the topology like every other agent, so it is visible in the admin,
 * carries its own permission state and its own row in the trust ledger.
 *
 * The id is reserved: the permission engine, the trust ledger and the diary
 * all address the assistant as `assistant`.
 */
import type { ISNode } from '../../contracts/topology';

export const ASSISTANT_AGENT_ID = 'assistant';

export const ASSISTANT_AGENT_NODE: ISNode = {
    id: ASSISTANT_AGENT_ID,
    type: 'agent',
    label: 'Project Assistant',
    lifecycle: 'ready',
    config: {
        roleName: 'Project Assistant',
        provider: 'auto',
        model: 'auto',
        temperature: 0.2,
        tools: [],
        // A system agent is part of the product, not a user's worker: it is
        // re-seeded on every mount and cannot be deleted.
        systemAgent: true,
        prompt:
            'You are the project assistant of SuperAgents OS. You answer from the wiki, ' +
            'the code and the live state of the system; you act only through the actions ' +
            'your panel gives you, and you ask before anything that writes.',
    },
};
