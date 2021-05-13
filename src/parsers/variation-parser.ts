import TrackRenderer from "../renderers/track-renderer";
import VariationRenderer from "../renderers/variation-renderer";
import TrackParser, { ErrorResponse, isErrorResponse } from "./track-parser";
import { SourceType, AminoAcid, Variant, Association, ProteinsAPIVariation, Xref } from "protvista-variation-adapter/src/variants";
import { VariantColors } from "../protvista/variation-filter";
export default class VariationParser implements TrackParser {
    private readonly categoryLabel = "Variation";
    public readonly categoryName = "VARIATION";
    public async parse(uniprotId: string, data: ProteinsAPIVariation | ErrorResponse): Promise<TrackRenderer | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const transformedData = this.transformData({
            ...data,
            accession: uniprotId
        });
        if (data.features.length > 0 && transformedData != null) {
            return new VariationRenderer(transformedData, this.categoryLabel, this.categoryName);
        } else {
            return null;
        }
    }
    private getSourceType(xrefs: Xref[], sourceType: SourceType) {
        const xrefNames = xrefs ? xrefs.map((ref) => ref.name) : [];
        if (sourceType === "uniprot" || sourceType === "mixed") {
            xrefNames.push("uniprot");
        }
        return xrefNames;
    };

    private transformData(
        data: ProteinsAPIVariation
    ): VariationData | null {
        const { sequence, features } = data;
        const variants = features.map((variant) => ({
            ...variant,
            accession: variant.genomicLocation,
            variant: variant.alternativeSequence ? variant.alternativeSequence : "-",
            start: variant.begin,
            xrefNames: this.getSourceType(variant.xrefs, variant.sourceType),
            hasPredictions: variant.predictions && variant.predictions.length > 0,
            tooltipContent: "",
            color: this.variantsFill(variant, sequence.length)
        }));
        if (!variants) return null;
        return { sequence, variants };
    };

    private variantsFill(variant: Variant, length: number) {
        if ((variant.alternativeSequence === '*') || (parseInt(variant.begin) > length)) {
            return VariantColors.othersColor;
        } else if ((variant.sourceType === SourceType.UniProt) ||
            (variant.sourceType === SourceType.Mixed)) {
            if (this.existAssociation(variant.association)) {
                return VariantColors.UPDiseaseColor;
            } else {
                return VariantColors.UPNonDiseaseColor;
            }
        } else if (variant.sourceType === SourceType.LargeScaleStudy && this.existAssociation(variant.association)) {
            return VariantColors.UPDiseaseColor;
        } else {
            var predictionScore = this.getPredictionColorScore(variant);

            if (variant.sourceType === SourceType.LargeScaleStudy && predictionScore === undefined) {
                return VariantColors.unknownColor;
            }

            return this.getVariantsFillColor(variant, predictionScore);
        }
    };

    private getPredictionColorScore(variant: Variant): number | undefined {
        let polyphenPrediction;
        let polyphenScore = 0;
        let siftPrediction;
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
    private existAssociation(association: Association[] | undefined): boolean {
        if (association) {
            if (association.length !== 0) {
                if (association[0].name || association[0].description) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    private getVariantsFillColor(variant: Variant, predictionScore: number | undefined) {

        if (predictionScore !== undefined) {
            return VariantColors.getPredictionColor(predictionScore);
        }
        return VariantColors.othersColor;
    };

}

export type VariationData = {
    readonly sequence: string,
    readonly variants: Variant[]
}