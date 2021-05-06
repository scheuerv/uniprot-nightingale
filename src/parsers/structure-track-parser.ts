import TrackParser from "./track-parser";
import { SealedEvent } from 'ts-typed-events';

export default interface StructureTrackParser<Output> extends TrackParser {
    readonly onStructureLoaded: SealedEvent<Output[]>;
    readonly onLabelClick: SealedEvent<Output>;
    failDataLoaded(): void;
}