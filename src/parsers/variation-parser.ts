import TrackRenderer from "../renderers/track-renderer";
import VariationRenderer from "../renderers/variation-renderer";
import TrackParser, { ErrorResponse, isErrorResponse } from "./track-parser";
import { SourceType, AminoAcid, Variant, ProteinsAPIVariation, Xref, Prediction, Evidence, ConsequenceType } from "protvista-variation-adapter/dist/es/variants";
import { VariantColors } from "../protvista/variation-filter";
import TooltipContent, { createVariantTooltip } from "../tooltip-content";
import { existAssociation } from "../utils";
export default class VariationParser implements TrackParser {
    private readonly categoryLabel = "Variation";
    public readonly categoryName = "VARIATION";
    constructor(private readonly overwritePredictions?: boolean, private readonly customSource?: string) { }
    public async parse(uniprotId: string, data: ProteinsAPIVariation | ErrorResponse): Promise<TrackRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const transformedData = this.transformData({
            ...data,
            accession: uniprotId
        }, uniprotId, this.overwritePredictions);
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
        const variants = features.map((variant) => ({
            ...variant,
            variant: variant.alternativeSequence ? variant.alternativeSequence : "-",
            start: variant.begin,
            end: variant.end,
            tooltipContent: createVariantTooltip(variant, uniprotId, undefined, overwritePredictions, this.customSource),
            color: this.variantsFill(variant, sequence.length),
            customSource: this.customSource
        }));
        if (!variants) return null;
        return { sequence, variants };
    };

    private variantsFill(variant: VariantWithSources, length: number): string {
        if ((variant.alternativeSequence === '*') || (parseInt(variant.begin) > length)) {
            return VariantColors.othersColor;
        } else if ((variant.sourceType === SourceType.UniProt) ||
            (variant.sourceType === SourceType.Mixed)) {
            if (existAssociation(variant.association)) {
                return VariantColors.UPDiseaseColor;
            } else {
                return VariantColors.UPNonDiseaseColor;
            }
        } else if (variant.sourceType === SourceType.LargeScaleStudy && existAssociation(variant.association)) {
            return VariantColors.UPDiseaseColor;
        } else {
            var predictionScore = this.getPredictionColorScore(variant);

            if (variant.sourceType === SourceType.LargeScaleStudy && predictionScore === undefined) {
                return VariantColors.unknownColor;
            }

            return this.getVariantsFillColor(variant, predictionScore);
        }
    };

    private getPredictionColorScore(variant: VariantWithSources): number | undefined {
        let polyphenPrediction: undefined | string;
        let polyphenScore = 0;
        let siftPrediction: undefined | string;
        let siftScore = 0;
        if (variant.predictions) {
            variant.predictions.forEach(function (prediction) {
                if (prediction.predAlgorithmNameType == 'PolyPhen') {
                    polyphenPrediction = prediction.predictionValType;
                    polyphenScore = prediction.score;
                } else if (prediction.predAlgorithmNameType == 'SIFT') {
                    siftPrediction = prediction.predictionValType;
                    siftScore = prediction.score;
                }
            })
        }
        if (variant.alternativeSequence === undefined) {
            variant.alternativeSequence = AminoAcid.Empty;
            console.warn("Variant alternative sequence changed to * as no alternative sequence provided by the API", variant);
        }
        var sift = false,
            polyphen = false;
        if ((polyphenPrediction !== undefined) && (polyphenPrediction !== 'unknown')) {
            polyphen = polyphenScore !== undefined ? true : false;
        }
        if (siftPrediction !== undefined) {
            sift = siftScore !== undefined ? true : false;
        }
        if (sift && polyphen) {
            return (siftScore + (1 - polyphenScore)) / 2;
        } else if (sift && !polyphen) {
            return siftScore;
        } else if (!sift && polyphen) {
            return 1 - polyphenScore;
        } else if (polyphenPrediction === 'unknown') {
            return 1;
        } else {
            return undefined;
        }
    };

    private getVariantsFillColor(variant: VariantWithSources, predictionScore: number | undefined) {

        if (predictionScore !== undefined) {
            return VariantColors.getPredictionColor(predictionScore);
        }
        return VariantColors.othersColor;
    };

}

export type VariationData = {
    readonly sequence: string,
    readonly variants: VariantWithDescription[]
}

export type VariantWithDescription = Variant & {
    readonly description?: string;    
    readonly customSource?: string;
}
export type VariantWithSources = VariantWithDescription & {
    readonly otherSources?: Record<string, OtherSourceData>;
    readonly tooltipContent?: TooltipContent;
}

export type OtherSourceData =
    {
        readonly predictions?: Prediction[];
        readonly description?: string;
        readonly evidences?: Evidence[];
        readonly consequenceType?: ConsequenceType;
        readonly xrefs?: Xref[];
    }
