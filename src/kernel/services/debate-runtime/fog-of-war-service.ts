import type { IFogOfWarService, FogConfig } from '../../contracts/debate-fog-of-war';
export class FogOfWarService implements IFogOfWarService {
    filter(viewerId: string, all: string[]): FogConfig { return { visibleIds: all.filter(id=>id!==viewerId).slice(0,3) }; }
}
