import { VariantWithSources, VariationData } from "./variants";

export type FilterVariationData = {
    readonly type: string;
    readonly normal: string;
    readonly pos: number;
    variants: VariantWithSources[];
};

export type FilterCase = {
    readonly name: string;
    readonly type: {
        readonly name: string;
        readonly text: string;
    };
    readonly options: {
        readonly labels: string[];
        readonly colors: string[];
    };
    readonly properties: ((variant: VariantWithSources) => boolean)[];
    readonly filterDataVariation: (variants: FilterVariationData[]) => FilterVariationData[];
    readonly filterDataVariationGraph: (variants: VariationData) => VariantWithSources[];
};
