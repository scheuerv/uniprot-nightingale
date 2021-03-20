declare module 'protvista-variation' {
    import ProtvistaTrack from "protvista-track";
    import { VariationData } from "src/parsers/variation-parser";
    export = ProtvistaVariation;
    class ProtvistaVariation extends ProtvistaTrack {
        _originalData: VariationData
        _data: VariationData;
        set colorConfig(colorConfig: any);
        static get css(): string;
    }
}