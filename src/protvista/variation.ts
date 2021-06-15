import ProtvistaVariation from "protvista-variation";
import * as d3 from "d3";
import { createEmitter } from "ts-typed-events";
import { Variant } from "protvista-variation-adapter/src/variants";

export default class FixedProtvistaVariation extends ProtvistaVariation {
    private readonly emitOnRefreshed = createEmitter<void>();
    public readonly onRefreshed = this.emitOnRefreshed.event;
    private readonly emitOnDataUpdated = createEmitter<void>();
    public readonly onDataUpdated = this.emitOnDataUpdated.event;
    public connectedCallback(): void {
        super.connectedCallback();
        this.zoom.filter(function () {
            return !d3.event.button && d3.event.type != "dblclick";
        });
    }

    public refresh(): void {
        super.refresh();
        this.emitOnRefreshed.emit();
    }

    public updateData(data: Variant): void {
        super.updateData(data);
        this.emitOnDataUpdated();
    }
}
