import ProtvistaTrack from "protvista-track";
import { StructureInfo } from "../../types/accession";
import { SealedEvent } from "ts-typed-events";

export default interface TrackContainer {
    readonly track: ProtvistaTrack;
    readonly onLabelClick: SealedEvent<StructureInfo>;
    addData(): void;
    activate(): void;
    deactivate(): void;
    getStructureInfo(): StructureInfo | undefined;
}
