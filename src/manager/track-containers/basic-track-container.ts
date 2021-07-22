import ProtvistaTrack from "protvista-track";
import { createEmitter } from "ts-typed-events";
import TrackContainer from "./track-container";
import { StructureInfo, TrackRow } from "../../types/accession";

/**
 * Contains one track (ProtvistaTrack), adds data to it when asked. Emits
 * structure info when clicked on its label (and remembers active state).
 */
export default class BasicTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<StructureInfo>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    private active = false;

    constructor(
        public readonly track: ProtvistaTrack,
        private readonly trackRow: TrackRow,
        private readonly labelElement: JQuery<HTMLElement>
    ) {
        // If track contains info about structure we can click on row's label
        // to emit event with this info.
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

    /**
     * Set this track as active. It is called when
     * clicked on this track's label.
     */
    public activate(): void {
        this.active = true;
        this.labelElement.addClass("bold");
    }

    /**
     * Set this track as active. It is called when
     * clicked on other track's label.
     */
    public deactivate(): void {
        this.active = false;
        this.labelElement.removeClass("bold");
    }

    public addData(): void {
        this.track.data = this.trackRow.rowData;
    }
}
