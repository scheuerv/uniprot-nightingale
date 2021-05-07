import ProtvistaTrack from "protvista-track";
import { createEmitter } from "ts-typed-events";
import { VariationData } from "../parsers/variation-parser";
import { TrackContainer } from "./track-container";
import { Output } from "./track-manager";

export default class VariationTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<Output>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    constructor(public readonly track: ProtvistaTrack, private readonly rowData: VariationData) {
    }
    public getOutput() {
        return undefined;
    }
    public  activate(): void {

    }
    public  deactivate(): void {

    }
    public addData() {
        this.track.data = this.rowData;
    }
}