import ProtvistaTrack from "protvista-track";
import { StructureInfo, TrackRow } from "../../types/accession";
import { createEmitter } from "ts-typed-events";
import TrackContainer from "./track-container";

export default class MainTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<StructureInfo>();
    public readonly onLabelClick = this.emitOnLabelClick.event;

    constructor(
        public readonly track: ProtvistaTrack,
        private readonly emptyTrack: ProtvistaTrack,
        private readonly trackRow: TrackRow
    ) {}

    public getStructureInfo(): undefined {
        return undefined;
    }

    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }

    public addData(): void {
        this.track.data = this.trackRow.rowData;
        this.emptyTrack.data = [];
    }
}
