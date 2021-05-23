import TrackRenderer from "../renderers/track-renderer";
import VariationRenderer from "../renderers/variation-renderer";
import TrackParser, { ErrorResponse, isErrorResponse } from "./track-parser";
import { SourceType, AminoAcid, Variant, Xref, Prediction, Evidence, ConsequenceType } from "protvista-variation-adapter/dist/es/variants";
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
            return {
                ...variantWithoutTooltip,
                tooltipContent: createVariantTooltip(variantWithoutTooltip, uniprotId, undefined, overwritePredictions, this.customSource),
                color: this.variantsFill(variantWithoutTooltip, sequence.length, overwritePredictions)

            }
        });
        if (!variants) return null;
        return { sequence, variants };
    };

    private variantsFill(variant: VariantWithSources, length: number, overwritePredictions?: boolean): string {
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
            let externalPrediction: number | undefined;
            let extDatum: OtherSourceData | undefined = undefined;
            if (variant.otherSources) {
                for (const source in variant.otherSources) {
                    const data = variant.otherSources[source];
                    externalPrediction = this.getPredictionColorScore(data);
                    extDatum = data;
                    break;
                }

            }
            const predictionScore = this.getPredictionColorScore(variant);

            if (variant.sourceType === SourceType.LargeScaleStudy && predictionScore === undefined) {
                return VariantColors.unknownColor;
            }
            return this.getVariantsFillColor(variant, predictionScore, extDatum, externalPrediction, overwritePredictions);

        }
    }

    private getPredictionColorScore(variant: OtherSourceData): number | undefined {
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

    private getVariantsFillColor(variant: VariantWithSources, predictionScore: number | undefined, extDatum: OtherSourceData | undefined, externalPredictionScore: number | undefined, overwritePredictions?: boolean) {
        if (overwritePredictions) {
            if (externalPredictionScore !== undefined) {
                return VariantColors.getPredictionColor(externalPredictionScore);
            } else if (predictionScore !== undefined) {
                return VariantColors.getPredictionColor(predictionScore);
            }
        } else {
            if (predictionScore !== undefined) {
                return VariantColors.getPredictionColor(predictionScore);
            } else if (externalPredictionScore !== undefined) {
                return VariantColors.getPredictionColor(externalPredictionScore);
            }
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
    readonly variant: string;
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
export type ProteinsAPIVariation = {
    sequence: string;
    features: VariantWithSources[];
};
