import { Association, SourceType } from "protvista-variation-adapter/dist/es/variants";
import { VariantColors } from "../config/variant-colors";
import { VariantWithSources, OtherSourceData, VariationData } from "../types/variants";
import { FilterCase, FilterVariationData } from "../types/variation-filter";

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

export function filterDataVariation(
    filter: FilterCase,
    data: FilterVariationData[]
): FilterVariationData[] {
    const newData: FilterVariationData[] = [];
    if (!filter) {
        return data;
    }
    data.forEach((feature) => {
        const clonedVariants = Object.assign({}, feature);
        clonedVariants.variants = feature.variants.filter((variant: VariantWithSources) => {
            return filter.properties.every((property) => {
                return property(variant);
            });
        });
        newData.push(clonedVariants);
    });
    return newData;
}

export function filterDataVariationGraph(
    filter: FilterCase,
    data: VariationData
): VariantWithSources[] {
    if (!filter) {
        return data.variants;
    }
    return data.variants.filter((variant: VariantWithSources) => {
        return filter.properties.every((property) => {
            return property(variant);
        });
    });
}
