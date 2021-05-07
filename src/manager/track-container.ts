import ProtvistaTrack from "protvista-track";
import { createEmitter, SealedEvent } from "ts-typed-events";
import { TrackRow } from "../renderers/basic-track-renderer";
import { Output } from "./track-manager";

export interface TrackContainer {
    readonly track: ProtvistaTrack;
    readonly onLabelClick: SealedEvent<Output>;
    addData(): void;
    activate(): void;
    deactivate(): void;
    getOutput(): Output | undefined;

}

export default class BasicTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<Output>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    private active = false;
    constructor(public readonly track: ProtvistaTrack, private readonly trackRow: TrackRow, private readonly labelElement: d3.Selection<HTMLDivElement, undefined, null, undefined>) {
        if (trackRow.output) {
            labelElement.style("cursor", "pointer");
            labelElement.on('mouseover', () => {
                labelElement.classed('bold', true);
            })
            labelElement.on('mouseout', () => {
                if (!this.active) {
                    labelElement.classed('bold', false);
                }
            })
            labelElement.on('click', () => {
                this.emitOnLabelClick?.emit(trackRow.output!);
            });
        }
    }
    public getOutput() {
        return this.trackRow.output;
    }
    public activate(
    ) {
        this.active = true;
        this.labelElement.classed('bold', true);
    }
    public deactivate() {
        this.active = false;
        this.labelElement.classed('bold', false);
    }
    public addData() {
        this.track.data = this.trackRow.rowData;
    }
}
export class MainTrackContainer<T> implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<Output>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    constructor(public readonly track: ProtvistaTrack, public readonly emptyTrack: ProtvistaTrack, private readonly data: T) {

    }
    public getOutput() {
        return undefined;
    }
    public activate(): void {
    }
    public deactivate(): void {
    }
    public addData() {
        this.track.data = this.data;
        this.emptyTrack.data = [];
    }
}