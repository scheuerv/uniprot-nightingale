import ProtvistaTrack from "protvista-track";
import { Output } from "../../types/accession";
import { SealedEvent } from "ts-typed-events";

export default interface TrackContainer {
    readonly track: ProtvistaTrack;
    readonly onLabelClick: SealedEvent<Output>;
    addData(): void;
    activate(): void;
    deactivate(): void;
    getOutput(): Output | undefined;
}
