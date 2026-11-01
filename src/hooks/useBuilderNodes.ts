import { useMemo } from 'react';
import { builderNodeCatalog } from '../kernel/instances';
import type { BuilderNodeDefinition } from '../kernel/contracts/builder-node';

/**
 * useBuilderNodes — реактивный доступ к каталогу узлов Builder (Builder как IDE).
 *
 * По умолчанию возвращает только exposed-узлы (для палитры). При
 * exposedOnly:false — все узлы (включая скрытые cognitive-killer-сервисы).
 */
export function useBuilderNodes(exposedOnly = true): BuilderNodeDefinition[] {
    return useMemo(
        () => (exposedOnly ? builderNodeCatalog.getExposed() : builderNodeCatalog.list()),
        [exposedOnly],
    );
}
