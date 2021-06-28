import { SourceType } from "protvista-variation-adapter/dist/es/variants";
import { VariantWithSources, VariationData } from "../types/variants";
import { FilterCase, FilterVariationData } from "../types/variation-filter";
import { filterDataVariation, filterDataVariationGraph } from "../utils/variants-utils";
import { VariantColors } from "./variant-colors";

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
