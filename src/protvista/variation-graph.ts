import ProtvistaVariationGraph from "protvista-variation-graph";
import { VariationData } from "../parsers/variation-parser";
import d3 = require('d3');
export default class FixedVariationGraph extends ProtvistaVariationGraph {
    public set data(data: VariationData) {
        this._originalData = data;
        super.data = data;
    }

    public connectedCallback() {
        super.connectedCallback();
        this.zoom.filter(function () {
            return !d3.event.button && d3.event.type != "dblclick";
        });
    }

    public _applyFilters() {
        super._applyFilters();
        const data = this.getCurrentData();
        const totalsArray = {
            total: new Uint8ClampedArray(data.sequence.length),
            diseaseTotal: new Uint8ClampedArray(data.sequence.length)
        };

        for (const { begin, association } of data.variants) {
            const index = +begin;
            if (index < 1 || index > data.sequence.length) continue;
            totalsArray.total[index]++;
            if (!association) continue;
            const hasDisease = association.find(
                association => association.disease === true
            );
            if (hasDisease) totalsArray.diseaseTotal[index]++;
        }
        this._totalsArray = totalsArray;
        super._createTrack();
    }

    private getCurrentData(): VariationData {
        let data = this._data;
        if (Array.isArray(data)) {
            const newData = Object.assign({}, this._originalData);
            newData.variants = data;
            data = newData;
        }
        return data;
    }
}