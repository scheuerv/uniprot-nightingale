import TrackRenderer from "../renderers/track-renderer";
import VariationRenderer from "../renderers/variation-renderer";
import TrackParser, { ErrorResponse, isErrorResponse } from "./track-parser";
import { AminoAcid, Variant, Xref, Prediction, Evidence, ConsequenceType } from "protvista-variation-adapter/dist/es/variants";
import TooltipContent, { createVariantTooltip } from "../tooltip-content";
import { variantsFill } from "../utils";
export default class VariationParser implements TrackParser {
    private readonly categoryLabel = "Variation";
    public readonly categoryName = "VARIATION";
    constructor(private readonly overwritePredictions?: boolean, private readonly customSource?: string) { }
    public async parse(uniprotId: string, data: ProteinsAPIVariation | ErrorResponse): Promise<TrackRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const transformedData = this.transformData(data, uniprotId, this.overwritePredictions);
        if (data.features.length > 0 && transformedData != null) {
            return [new VariationRenderer(transformedData, this.categoryLabel, this.categoryName, uniprotId, this.overwritePredictions)];
        } else {
            return null;
        }
    }

    private transformData(
        data: ProteinsAPIVariation, uniprotId: string, overwritePredictions?: boolean
    ): VariationData | null {

        const { sequence, features } = data;
        const variants = features.map((variant: VariantWithSources) => {
            if (variant.alternativeSequence === undefined) {
                console.warn("Variant alternative sequence changed to * as no alternative sequence provided by the API", variant);
            }
            const alternativeSequence = variant.alternativeSequence ?? AminoAcid.Empty;
            const variantWithoutTooltip = {
                ...variant,
                variant: alternativeSequence,
                alternativeSequence: alternativeSequence,
                start: variant.begin,
                end: variant.end,
                customSource: this.customSource
            }
            const otherSources: Record<string, OtherSourceData> = variant.otherSources??{};
            if (this.customSource) {
                otherSources[this.customSource] = variantWithoutTooltip;
            }
            return {
                ...variantWithoutTooltip,
                tooltipContent: createVariantTooltip(variantWithoutTooltip, uniprotId, undefined, overwritePredictions, this.customSource),
                color: variantsFill(variantWithoutTooltip,otherSources, overwritePredictions),
                otherSources: otherSources
            }
        });
        if (!variants) return null;
        return { sequence, customSources: this.customSource ? [this.customSource] : [], variants };
    };



}

export type VariationData = {
    readonly sequence: string,
    readonly customSources: string[],
    readonly variants: VariantWithSources[]
}

export type VariantWithSources = Variant & {
    readonly otherSources?: Record<string, OtherSourceData>;
    readonly tooltipContent?: TooltipContent;
    readonly description?: string;
    readonly customSource?: string;
    readonly color: string;
    readonly variant: string;
}

export type OtherSourceData =
    {
        readonly predictions?: Prediction[];
        readonly description?: string;
        readonly evidences?: Evidence[];
        readonly consequenceType?: ConsequenceType;
        readonly xrefs?: Xref[];
    }
export type ProteinsAPIVariation = {
    sequence: string;
    features: VariantWithSources[];
};
