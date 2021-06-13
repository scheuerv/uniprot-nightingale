import {
    ConsequenceType,
    Evidence,
    Prediction,
    Variant,
    Xref
} from "protvista-variation-adapter/dist/es/variants";
import { TooltipContent } from "./tooltip-content";

export type VariantWithSources = Variant & {
    readonly otherSources?: Record<string, OtherSourceData>;
    readonly tooltipContent?: TooltipContent;
    readonly description?: string;
    readonly customSource?: string;
    readonly color: string;
    readonly variant: string;
};

export type OtherSourceData = {
    readonly predictions?: Prediction[];
    readonly description?: string;
    readonly evidences?: Evidence[];
    readonly consequenceType?: ConsequenceType;
    readonly xrefs?: Xref[];
};

export type VariationData = {
    readonly sequence: string;
    readonly customSources: string[];
    readonly variants: VariantWithSources[];
};

export type ProteinsAPIVariation = {
    sequence: string;
    features: VariantWithSources[];
};
