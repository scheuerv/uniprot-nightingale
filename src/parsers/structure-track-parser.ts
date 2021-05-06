import TrackParser from "./track-parser";
import { SealedEvent } from 'ts-typed-events';
import { Output } from "../manager/track-manager";

export default interface StructureTrackParser extends TrackParser {
    readonly onStructureLoaded: SealedEvent<Output[]>;
    readonly onLabelClick: SealedEvent<Output>;
    failDataLoaded(): void;
}