import ProtvistaTrack from "protvista-track";
import { Output } from "../types/accession";
import { createEmitter } from "ts-typed-events";
import TrackContainer from "./track-container";

export default class MainTrackContainer<T> implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<Output>();
    public readonly onLabelClick = this.emitOnLabelClick.event;

    constructor(
        public readonly track: ProtvistaTrack,
        public readonly emptyTrack: ProtvistaTrack,
        private readonly data: T
    ) {}

    public getOutput(): undefined {
        return undefined;
    }

    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }

    public addData(): void {
        this.track.data = this.data;
        this.emptyTrack.data = [];
    }
}
