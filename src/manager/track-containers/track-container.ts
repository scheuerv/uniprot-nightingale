import ProtvistaTrack from "protvista-track";
import { StructureInfo } from "../../types/accession";
import { SealedEvent } from "ts-typed-events";

/**
 * It usually contains track which can be later filled with data
 * using addData method (ProtvistaTrack throws exception if
 * data are added before its added to the DOM tree)
 */
export default interface TrackContainer {
    readonly track: ProtvistaTrack;
    readonly onLabelClick: SealedEvent<StructureInfo>;
    addData(): void;
    activate(): void;
    deactivate(): void;
    getStructureInfo(): StructureInfo | undefined;
}
