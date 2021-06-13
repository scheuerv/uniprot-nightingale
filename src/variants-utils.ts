import { Association, SourceType } from "protvista-variation-adapter/dist/es/variants";
import * as d3 from "d3";
import { VariantWithSources, OtherSourceData } from "./types/variants";

export function variantsFill(
    variant: VariantWithSources,
    newSources?: Record<string, OtherSourceData>,
    overwritePredictions?: boolean
): string {
    if (variant.alternativeSequence === "*") {
        return VariantColors.othersColor;
    } else if (
        variant.sourceType === SourceType.UniProt ||
        variant.sourceType === SourceType.Mixed
    ) {
        if (existAssociation(variant.association)) {
            return VariantColors.UPDiseaseColor;
        } else {
            return VariantColors.UPNonDiseaseColor;
        }
    } else if (
        variant.sourceType === SourceType.LargeScaleStudy &&
        existAssociation(variant.association)
    ) {
        return VariantColors.UPDiseaseColor;
    } else {
        let externalPrediction: number | undefined;
        if (newSources) {
            for (const source in newSources) {
                const data: OtherSourceData = newSources[source];
                externalPrediction = getPredictionColorScore(data);
                break;
            }
        }
        const predictionScore: number | undefined = getPredictionColorScore(variant);
        if (!variant.sourceType && !externalPrediction && !variant.consequenceType) {
            return "#000000";
        }
        if (variant.sourceType === SourceType.LargeScaleStudy && predictionScore === undefined) {
            return VariantColors.unknownColor;
        }
        return getVariantsFillColor(predictionScore, externalPrediction, overwritePredictions);
    }
}

export function getPredictionColorScore(variant: OtherSourceData): number | undefined {
    let polyphenPrediction: undefined | string;
    let polyphenScore = 0;
    let siftPrediction: undefined | string;
    let siftScore = 0;
    if (variant.predictions) {
        variant.predictions.forEach(function (prediction) {
            if (prediction.predAlgorithmNameType == "PolyPhen") {
                polyphenPrediction = prediction.predictionValType;
                polyphenScore = prediction.score;
            } else if (prediction.predAlgorithmNameType == "SIFT") {
                siftPrediction = prediction.predictionValType;
                siftScore = prediction.score;
            }
        });
    }
    let sift = false,
        polyphen = false;
    if (polyphenPrediction !== undefined && polyphenPrediction !== "unknown") {
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
    } else if (polyphenPrediction === "unknown") {
        return 1;
    } else {
        return undefined;
    }
}

export function getVariantsFillColor(
    predictionScore: number | undefined,
    externalPredictionScore: number | undefined,
    overwritePredictions?: boolean
): string {
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
}

export function existAssociation(association: Association[] | undefined): boolean {
    if (association) {
        if (association.length !== 0) {
            if (association[0].name || association[0].description) {
                return true;
            }
        }
    }
    return false;
}

export const VariantColors = {
    UPDiseaseColor: "#990000",
    deleteriousColor: "#002594",
    benignColor: "#8FE3FF",
    UPNonDiseaseColor: "#99cc00",
    othersColor: "#FFCC00",
    unknownColor: "#808080",
    consequenceColors: [
        "#66c2a5",
        "#8da0cb",
        "#e78ac3",
        "#e5c494",
        "#fc8d62",
        "#ffd92f",
        "#a6d854",
        "#b3b3b3"
    ],

    getPredictionColor: d3.scaleLinear<string>().domain([0, 1]).range(["#002594", "#8FE3FF"])
};
