import { SourceType } from "protvista-variation-adapter/dist/es/variants";
import ProtvistaFilter from "protvista-filter";
import { html, css, CSSResultOrNative, CSSResultArray } from "lit-element";
import { TemplateResult } from "lit-html";
import { VariantColors } from "../variants-utils";
import { VariantWithSources, VariationData } from "../types/variants";
export default class VariationFilter extends ProtvistaFilter {
    public multiFor: Map<
        string,
        | ((filterCase: FilterCase) => (variants: FilterVariationData[]) => FilterVariationData[])
        | ((filterCase: FilterCase) => (variants: VariationData) => VariantWithSources[])
    >;

    public getCheckBox(filterItem: FilterCase): TemplateResult {
        const { name, options } = filterItem;
        const { labels } = options;
        const isCompound = options.colors.length > 1;
        const result = html`
            <label class="protvista_checkbox ${isCompound ? "compound" : ""}" tabindex="0">
                <input
                    type="checkbox"
                    class="protvista_checkbox_input"
                    ?checked="true"
                    .value="${name}"
                    @change="${() => this.toggleFilter(name)}"
                />
                <span
                    class="checkmark"
                    style=${`background: ${
                        isCompound
                            ? `
              linear-gradient(${options.colors[0]},
              ${options.colors[1]})
            `
                            : options.colors[0]
                    };`}
                ></span>
                <div>
                    ${labels.map((label: string) => {
                        return html`<div class="protvista_checkbox_label">${label}</div>`;
                    })}
                </div>
            </label>
        `;
        return result;
    }

    public static get styles(): (CSSResultOrNative | CSSResultArray)[] {
        return [
            ProtvistaFilter.styles,
            css`
                .protvista_checkbox.compound .checkmark {
                    align-self: stretch;
                    height: auto;
                }
            `
        ];
    }

    public toggleFilter(name: string): void {
        if (!this.selectedFilters.has(name)) {
            this.selectedFilters.add(name);
        } else {
            this.selectedFilters.delete(name);
        }
        this.multiFor.forEach((filterFunction, forId) => {
            this.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        type: "filters",
                        handler: "property",
                        for: forId,
                        value: this.filters
                            .filter((filter: FilterCase) => this.selectedFilters.has(filter.name))
                            .map((filter: FilterCase) => ({
                                category: filter.type.name,
                                filterFn: filterFunction(filter)
                            }))
                    }
                })
            );
        });
    }
}

function getFilterByName(name: string): FilterCase | undefined {
    for (let i = 0; i < filterCases.length; i++) {
        if (filterCases[i].name === name) return filterCases[i];
    }
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

export type FilterVariationData = {
    readonly type: string;
    readonly normal: string;
    readonly pos: number;
    variants: VariantWithSources[];
};

export type FilterCase = {
    readonly name: string;
    readonly type: {
        readonly name: string;
        readonly text: string;
    };
    readonly options: {
        readonly labels: string[];
        readonly colors: string[];
    };
    readonly properties: ((variant: VariantWithSources) => boolean)[];
    readonly filterDataVariation: (variants: FilterVariationData[]) => FilterVariationData[];
    readonly filterDataVariationGraph: (variants: VariationData) => VariantWithSources[];
};
