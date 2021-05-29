import { createEmitter } from "ts-typed-events";
import { VariationData } from "../parsers/variation-parser";
import { TrackContainer } from "./track-container";
import { Output } from "./track-manager";
import ProtvistaVariationGraph from "protvista-variation-graph";

export default class VariationGraphTrackContainer implements TrackContainer {
    private readonly emitOnLabelClick = createEmitter<Output>();
    public readonly onLabelClick = this.emitOnLabelClick.event;
    constructor(public readonly track: ProtvistaVariationGraph, private readonly rowData: VariationData) {
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