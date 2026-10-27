/**
 * Exception (veto) template domain types.
 *
 * An exception is a piece of text the operator forbids the agent from
 * producing as part of an answer. The agent treats it as "do not answer
 * like this / do not say this". This is the inverse of a Lens: lenses add
 * perspectives, exceptions subtract forbidden answers.
 */

export type ExceptionMatchMode = 'contains' | 'exact' | 'regex';
export type ExceptionScope = 'all' | 'assistant' | 'chat' | 'global';

export interface ExceptionTemplate {
    id: string;
    name: string;
    /** Short description shown in the library. */
    description?: string;
    /** The forbidden text — an answer/statement the agent must not give. */
    text: string;
    /** How to match the agent's draft output against the text. */
    matchMode: ExceptionMatchMode;
    /** Where this exception applies. 'all' and 'global' affect every surface. */
    scope: ExceptionScope;
    /** When false the template is kept but inactive. */
    enabled: boolean;
    category?: string;
    tags?: string[];
    createdAt: number;
}

export function makeExceptionId(): string {
    return `exc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
