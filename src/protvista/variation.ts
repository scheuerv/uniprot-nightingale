import ProtvistaVariation from "protvista-variation";
import d3 = require('d3');
import { createEmitter } from "ts-typed-events";
import { Variant } from "protvista-variation-adapter/dist/es/variants";

export default class FixedProtvistaVariation extends ProtvistaVariation {
    private readonly emitOnRefreshed = createEmitter<void>();
    public readonly onRefreshed = this.emitOnRefreshed.event;
    private readonly emitOnDataUpdated = createEmitter<void>();
    public readonly onDataUpdated = this.emitOnDataUpdated.event;
    public connectedCallback() {
        super.connectedCallback();
        this.zoom.filter(function () {
            return !d3.event.button && d3.event.type != "dblclick";
        });
    }
    public refresh() {
        super.refresh();
        this.emitOnRefreshed.emit();
    }

    public updateData(data: Variant) {
        super.updateData(data);
        this.emitOnDataUpdated();
    }
}