import ProtvistaVariation from "protvista-variation";
import * as d3 from "d3";
import { createEmitter } from "ts-typed-events";
import { Variant } from "protvista-variation-adapter/dist/es/variants";
/**
 * Visualizes matrix of mutations.
 * Extends standard ProtvistaVariation (it has extra events).
 * Disable zoom on double click (which caused random issues).
 *
 */
export default class FixedProtvistaVariation extends ProtvistaVariation {
    private readonly emitOnRefreshed = createEmitter<void>();
    public readonly onRefreshed = this.emitOnRefreshed.event;
    private readonly emitOnDataUpdated = createEmitter<void>();
    public readonly onDataUpdated = this.emitOnDataUpdated.event;
    public connectedCallback(): void {
        super.connectedCallback();
        //do not zoom on double click
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
        this.emitOnDataUpdated.emit();
    }
}
