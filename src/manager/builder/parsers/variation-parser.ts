import VariationRenderer from "../renderers/variation-renderer";
import Parser, { isErrorResponse } from "./parser";
import { createVariantTooltip } from "../../tooltip-content";
import { variantsFill } from "../../../utils/variants-utils";
import {
    OtherSourceData,
    VariationsData,
    VariantWithSources,
    VariationData
} from "../../../types/variants";
import { AminoAcid } from "protvista-variation-adapter/dist/es/variants";
import { ErrorResponse } from "../../../types/error-response";
export default class VariationParser implements Parser<VariationsData> {
    private readonly categoryLabel = "Variation";
    public readonly categoryName = "VARIATION";

    constructor(
        private readonly overwritePredictions?: boolean,
        private readonly customSource?: string
    ) {}

    /**
     * Takes raw variation data from api and creates objects of type
     * VariationRenderer, which are used to create html element
     * representing raw data.
     *
     */
    public async parse(
        uniprotId: string,
        data: VariationsData | ErrorResponse
    ): Promise<VariationRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        if (data.features.length > 0) {
            const transformedData: VariationData = this.transformData(data, uniprotId);
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

    /**
     * Transforms input data (VariationsData) to VariationData
     * accepted by VariationRenderer.
     *
     * Main purpose is to add a custom source field according to the constructor
     * parameter.
     *
     * Creates a tooltip (it takes overwrite predictions from constructor)
     *
     */
    private transformData(data: VariationsData, uniprotId: string): VariationData {
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
                    this.overwritePredictions,
                    this.customSource
                ),
                color: variantsFill(variantWithoutTooltip, otherSources, this.overwritePredictions),
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
