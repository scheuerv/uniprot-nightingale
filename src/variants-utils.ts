import { Association, SourceType } from "protvista-variation-adapter/dist/es/variants";
import * as d3 from "d3";
import { VariantWithSources, OtherSourceData, VariationData } from "./types/variants";
import { FilterCase, FilterVariationData } from "./types/variation-filter";

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

const VariantColors = {
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

export const filterCases: FilterCase[] = [
    {
        name: "disease",
        type: {
            name: "consequence",
            text: "Filter Consequence"
        },
        options: {
            labels: ["Disease (reviewed)"],
            colors: [VariantColors.UPDiseaseColor]
        },
        properties: [
            function (variant: VariantWithSources): boolean {
                if (variant.association) {
                    return variant.association?.some((association) => association.disease === true);
                }
                return false;
            }
        ],
        filterDataVariation: function (variants: FilterVariationData[]): FilterVariationData[] {
            return filterDataVariation(getFilterByName("disease")!, variants);
        },
        filterDataVariationGraph: function (variants: VariationData): VariantWithSources[] {
            return filterDataVariationGraph(getFilterByName("disease")!, variants);
        }
    },
    {
        name: "prediction",
        type: {
            name: "consequence",
            text: "Filter Consequence"
        },
        options: {
            labels: ["Predicted deleterious", "Predicted benign"],
            colors: [VariantColors.deleteriousColor, VariantColors.benignColor]
        },
        properties: [
            function (variant: VariantWithSources): boolean {
                if (variant.alternativeSequence) return /[^*]/.test(variant.alternativeSequence);
                return false;
            },
            function (variant: VariantWithSources): boolean {
                return [SourceType.LargeScaleStudy, null].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
            /*'externalData': function(variant: Variant) {
                if (!variant.sourceType) {
                    return _.some(variant.externalData, function(data) {
                        return (data.polyphenPrediction && (data.polyphenPrediction !== 'del')) ||
                            (data.siftPrediction && (data.siftPrediction !== 'del'));
                    });
                } else {
                    return true;
                }
            }*/
        ],

        filterDataVariation: function (variants: FilterVariationData[]): FilterVariationData[] {
            return filterDataVariation(getFilterByName("prediction")!, variants);
        },
        filterDataVariationGraph: function (variants: VariationData): VariantWithSources[] {
            return filterDataVariationGraph(getFilterByName("prediction")!, variants);
        }
    },
    {
        name: "nonDisease",
        type: {
            name: "consequence",
            text: "Filter Consequence"
        },
        options: {
            labels: ["Non-disease (reviewed)"],
            colors: [VariantColors.UPNonDiseaseColor]
        },
        properties: [
            function (variant: VariantWithSources): boolean {
                return (
                    variant.association?.every((association) => {
                        return association.disease !== true;
                    }) || !variant.association
                );
            },
            function (variant: VariantWithSources): boolean {
                return [SourceType.UniProt, SourceType.Mixed].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],

        filterDataVariation: function (variants: FilterVariationData[]): FilterVariationData[] {
            return filterDataVariation(getFilterByName("nonDisease")!, variants);
        },
        filterDataVariationGraph: function (variants: VariationData): VariantWithSources[] {
            return filterDataVariationGraph(getFilterByName("nonDisease")!, variants);
        }
    },
    {
        name: "uncertain",
        type: {
            name: "consequence",
            text: "Filter Consequence"
        },
        options: {
            labels: ["Init, stop loss or gain"],
            colors: [VariantColors.othersColor]
        },
        properties: [
            function (variant: VariantWithSources): boolean {
                return variant.alternativeSequence === "*";
            }
        ],
        filterDataVariation: function (variants: FilterVariationData[]): FilterVariationData[] {
            return filterDataVariation(getFilterByName("uncertain")!, variants);
        },
        filterDataVariationGraph: function (variants: VariationData): VariantWithSources[] {
            return filterDataVariationGraph(getFilterByName("uncertain")!, variants);
        }
    },
    {
        name: "unknown",
        type: {
            name: "consequence",
            text: "Filter Consequence"
        },
        options: {
            labels: ["Unknown"],
            colors: [VariantColors.unknownColor]
        },
        properties: [
            function (variant: VariantWithSources): boolean {
                return !variant.association && !variant.predictions;
            },
            function (variant: VariantWithSources): boolean {
                if (variant.alternativeSequence) return /[^*]/.test(variant.alternativeSequence);
                return false;
            },
            function (variant: VariantWithSources): boolean {
                return [SourceType.LargeScaleStudy].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],
        filterDataVariation: function (variants: FilterVariationData[]): FilterVariationData[] {
            return filterDataVariation(getFilterByName("unknown")!, variants);
        },
        filterDataVariationGraph: function (variants: VariationData): VariantWithSources[] {
            return filterDataVariationGraph(getFilterByName("unknown")!, variants);
        }
    },
    {
        name: "uniprot",
        type: {
            name: "dataSource",
            text: "Filter data source"
        },
        options: {
            labels: ["UniProt reviewed"],
            colors: ["grey"]
        },
        properties: [
            function (variant: VariantWithSources): boolean {
                return [SourceType.UniProt, SourceType.Mixed].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],

        filterDataVariation: function (variants: FilterVariationData[]): FilterVariationData[] {
            return filterDataVariation(getFilterByName("uniprot")!, variants);
        },
        filterDataVariationGraph: function (variants: VariationData): VariantWithSources[] {
            return filterDataVariationGraph(getFilterByName("uniprot")!, variants);
        }
    },
    {
        name: "lss",
        type: {
            name: "dataSource",
            text: "Filter data source"
        },
        options: {
            labels: ["Large scale studies"],
            colors: ["grey"]
        },
        properties: [
            function (variant: VariantWithSources): boolean {
                return [SourceType.LargeScaleStudy, SourceType.Mixed].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],

        filterDataVariation: function (variants: FilterVariationData[]): FilterVariationData[] {
            return filterDataVariation(getFilterByName("lss")!, variants);
        },
        filterDataVariationGraph: function (variants: VariationData): VariantWithSources[] {
            return filterDataVariationGraph(getFilterByName("lss")!, variants);
        }
    }
];

function getFilterByName(name: string): FilterCase | undefined {
    for (let i = 0; i < filterCases.length; i++) {
        if (filterCases[i].name === name) return filterCases[i];
    }
}
