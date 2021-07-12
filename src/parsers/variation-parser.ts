import VariationRenderer from "../renderers/variation-renderer";
import TrackParser, { isErrorResponse } from "./track-parser";
import { createVariantTooltip } from "../tooltip-content";
import { variantsFill } from "../utils/variants-utils";
import {
    OtherSourceData,
    VariationsData,
    VariantWithSources,
    VariationData
} from "../types/variants";
import { AminoAcid } from "protvista-variation-adapter/dist/es/variants";
import { ErrorResponse } from "../types/error-response";
export default class VariationParser implements TrackParser<VariationsData> {
    private readonly categoryLabel = "Variation";
    public readonly categoryName = "VARIATION";

    constructor(
        private readonly overwritePredictions?: boolean,
        private readonly customSource?: string
    ) {}

    public async parse(
        uniprotId: string,
        data: VariationsData | ErrorResponse
    ): Promise<VariationRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        if (data.features.length > 0) {
            const transformedData: VariationData = this.transformData(
                data,
                uniprotId,
                this.overwritePredictions
            );
            return [
                new VariationRenderer(
                    transformedData,
                    this.categoryLabel,
                    this.categoryName,
                    uniprotId,
                    this.overwritePredictions
                )
            ];
        } else {
            return null;
        }
    }

    private transformData(
        data: VariationsData,
        uniprotId: string,
        overwritePredictions?: boolean
    ): VariationData {
        const { sequence, features } = data;
        const variants = features.map((variant: VariantWithSources) => {
            if (variant.alternativeSequence === undefined) {
                console.warn(
                    "Variant alternative sequence changed to * as no alternative sequence provided by the API",
                    variant
                );
            }
            const alternativeSequence = variant.alternativeSequence ?? AminoAcid.Empty;
            const variantWithoutTooltip: VariantWithSources = {
                ...variant,
                variant: alternativeSequence,
                alternativeSequence: alternativeSequence,
                start: variant.begin,
                end: variant.end,
                customSource: this.customSource
            };
            const otherSources: Record<string, OtherSourceData> = variant.otherSources ?? {};
            if (this.customSource) {
                otherSources[this.customSource] = {
                    predictions: variantWithoutTooltip.predictions,
                    description: variantWithoutTooltip.description,
                    evidences: variantWithoutTooltip.evidences,
                    consequenceType: variantWithoutTooltip.consequenceType,
                    xrefs: variantWithoutTooltip.xrefs
                };
            }
            return {
                ...variantWithoutTooltip,
                tooltipContent: createVariantTooltip(
                    variantWithoutTooltip,
                    uniprotId,
                    undefined,
                    overwritePredictions,
                    this.customSource
                ),
                color: variantsFill(variantWithoutTooltip, otherSources, overwritePredictions),
                otherSources: otherSources
            };
        });
        return {
            sequence,
            customSources: this.customSource ? [this.customSource] : [],
            variants
        };
    }
}
