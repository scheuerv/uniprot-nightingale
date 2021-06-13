import FixedProtvistaVariation from "../protvista/variation";
import { createEmitter } from "ts-typed-events";
import TrackContainer from "./track-container";
import { Output } from "../types/accession";
import { VariationData } from "../types/variants";

export default class VariationTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<Output>();
    public readonly onLabelClick = this.emitOnLabelClick.event;

    constructor(
        public readonly track: FixedProtvistaVariation,
        private readonly rowData: VariationData
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
        this.track.data = this.rowData;
    }
}
