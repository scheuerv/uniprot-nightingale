import TrackRenderer from '../renderers/track-renderer';

import { SealedEvent } from 'ts-typed-events';
export default interface TrackParser<Output> {
    readonly dataLoaded: SealedEvent<Output[]>;
    parse(uniprotId: string, data: any): Promise<TrackRenderer | null>;

}

