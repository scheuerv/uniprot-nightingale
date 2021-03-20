//@ts-ignore
import ProtvistaVariationGraph from "protvista-variation-graph";
//@ts-ignore
import ProtvistaTrack from "protvista-track";
import { VariationData } from "./parsers/variation-parser";
export default class VariationGraph extends ProtvistaVariationGraph {
    protected _data: VariationData;
    set data(data: VariationData) {
        super._originalData = data;
        super.data = data;
    }
    _applyFilters() {
        super._applyFilters();
        const data = this.getCurrentData();
        const totalsArray = {
            total: new Uint8ClampedArray(data.sequence.length),
            diseaseTotal: new Uint8ClampedArray(data.sequence.length)
        };

        for (const { begin, association } of data.variants) {
            const index = +begin;
            // skip if the variant is outside of bounds
            // eslint-disable-next-line no-continue
            if (index < 1 || index > data.sequence.length) continue;

            // eslint-disable-next-line no-plusplus
            totalsArray.total[index]++;

            // eslint-disable-next-line no-continue
            if (!association) continue;
            const hasDisease = association.find(
                association => association.disease === true
            );
            // eslint-disable-next-line no-plusplus
            if (hasDisease) totalsArray.diseaseTotal[index]++;
        }
        super._totalsArray = totalsArray;
        super._createTrack();
    }
    
    private getCurrentData(): VariationData {
        let data = (this as ProtvistaTrack)._data;
        if (Array.isArray(data)) {
            const newData = Object.assign({}, (this as ProtvistaTrack)._originalData);
            newData.variants = data;
            data = newData;
        }
        return data;
    }
}