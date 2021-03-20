declare module 'protvista-variation-graph' {
    import ProtvistaTrack from "protvista-track";
    import { VariationData } from "src/parsers/variation-parser";
    export = ProtvistaVariationGraph;
    class ProtvistaVariationGraph extends ProtvistaTrack {
        _originalData: VariationData
        _data: VariationData;
        _totalsArray: { total: Uint8ClampedArray, diseaseTotal: Uint8ClampedArray }
        set data(data: VariationData);
        _applyFilters(): void;
    }
}