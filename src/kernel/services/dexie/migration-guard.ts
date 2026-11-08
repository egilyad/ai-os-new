import { rootLogger } from '../logger-service';
import type { DexieVersionDef } from './schema-versions';

const LOGGER = rootLogger.child('DatabaseService');

/**
 * Аудит цепочки миграций Dexie: предупреждает о таблицах, исчезнувших
 * между соседними версиями (потеря данных), и логирует изменения индексов.
 * Использует тот же источник истины (DEXIE_VERSION_DEFS), что и
 * регистрация версий в SuperAgentsDB, — расхождение данных исключено.
 */
export function validateMigrationChain(versionDefs: readonly DexieVersionDef[]): void {
    for (let i = 1; i < versionDefs.length; i++) {
        const prev = versionDefs[i - 1]!;
        const curr = versionDefs[i]!;
        for (const table of Object.keys(prev.stores)) {
            if (!curr.stores[table]) {
                LOGGER.warn(
                    'DatabaseService',
                    `Migration v${prev.version}→v${curr.version}: table '${table}' dropped. Data loss possible if upgrade handler missing.`,
                );
            } else if (prev.stores[table] !== curr.stores[table]) {
                const prevIdxs = prev.stores[table]!.split(', ').sort().join(', ');
                const currIdxs = curr.stores[table]!.split(', ').sort().join(', ');
                if (prevIdxs !== currIdxs) {
                    LOGGER.info(
                        'DatabaseService',
                        `Migration v${prev.version}→v${curr.version}: table '${table}' indexes changed: [${prev.stores[table]}] → [${curr.stores[table]}]`,
                    );
                }
            }
        }
    }
}
