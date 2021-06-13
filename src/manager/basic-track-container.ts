import ProtvistaTrack from "protvista-track";
import { createEmitter } from "ts-typed-events";
import TrackContainer from "./track-container";
import { Output, TrackRow } from "../types/accession";

export default class BasicTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<Output>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    private active = false;

    constructor(
        public readonly track: ProtvistaTrack,
        private readonly trackRow: TrackRow,
        private readonly labelElement: d3.Selection<HTMLDivElement, undefined, null, undefined>
    ) {
        if (trackRow.output) {
            labelElement.style("cursor", "pointer");
            labelElement.on("mouseover", () => {
                labelElement.classed("bold", true);
            });
            labelElement.on("mouseout", () => {
                if (!this.active) {
                    labelElement.classed("bold", false);
                }
            });
            labelElement.on("click", () => {
                this.emitOnLabelClick?.emit(trackRow.output!);
            });
        }
    }

    public getOutput(): Output | undefined {
        return this.trackRow.output;
    }

    public activate(): void {
        this.active = true;
        this.labelElement.classed("bold", true);
    }

    public deactivate(): void {
        this.active = false;
        this.labelElement.classed("bold", false);
    }

    public addData(): void {
        this.track.data = this.trackRow.rowData;
    }
}
