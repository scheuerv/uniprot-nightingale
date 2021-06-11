import ProtvistaTrack from "protvista-track";
import { SealedEvent } from "ts-typed-events";
import { Output } from "./track-manager";

export default interface TrackContainer {
    readonly track: ProtvistaTrack;
    readonly onLabelClick: SealedEvent<Output>;
    addData(): void;
    activate(): void;
    deactivate(): void;
    getOutput(): Output | undefined;
}
