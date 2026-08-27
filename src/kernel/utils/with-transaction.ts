import { TransactionContext } from '../services/transaction';
import type { ITransaction } from '../contracts/transaction';

export async function withTransaction<T>(
    source: string,
    fn: (tx: ITransaction) => Promise<T>,
    eventBus?: { emit: (event: string, data?: unknown) => void },
): Promise<T> {
    const tx = new TransactionContext(source);
    try {
        const result = await fn(tx);
        await tx.commit(eventBus);
        return result;
    } catch (e) {
        await tx.rollback(eventBus);
        throw e;
    }
}
