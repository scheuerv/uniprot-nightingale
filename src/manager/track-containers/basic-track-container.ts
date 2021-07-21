import ProtvistaTrack from "protvista-track";
import { createEmitter } from "ts-typed-events";
import TrackContainer from "./track-container";
import { StructureInfo, TrackRow } from "../../types/accession";

export default class BasicTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<StructureInfo>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    private active = false;

    constructor(
        public readonly track: ProtvistaTrack,
        private readonly trackRow: TrackRow,
        private readonly labelElement: JQuery<HTMLElement>
    ) {
        if (trackRow.structureInfo) {
            labelElement.css("cursor", "pointer");
            labelElement.on("mouseover", () => {
                labelElement.addClass("bold");
            });
            labelElement.on("mouseout", () => {
                if (!this.active) {
                    labelElement.removeClass("bold");
                }
            });
            labelElement.on("click", () => {
                this.emitOnLabelClick?.emit(trackRow.structureInfo!);
            });
        }
    }

    public getStructureInfo(): StructureInfo | undefined {
        return this.trackRow.structureInfo;
    }

    public activate(): void {
        this.active = true;
        this.labelElement.addClass("bold");
    }

    public deactivate(): void {
        this.active = false;
        this.labelElement.removeClass("bold");
    }

    public addData(): void {
        this.track.data = this.trackRow.rowData;
    }
}
