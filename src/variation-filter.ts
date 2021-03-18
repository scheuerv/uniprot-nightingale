import { PredAlgorithmNameType, SourceType, Variant } from "protvista-variation-adapter/src/variants";
//@ts-ignore
import ProtvistaFilter from "protvista-filter";
import d3 = require("d3");
import { html, css, CSSResult } from "lit-element";
export default class VariationFilter extends ProtvistaFilter {
    getCheckBox(filterItem: FilterCase) {
        const { name, options } = filterItem;
        const { labels } = options;
        const isCompound = options.colors.length > 1;
        const result = html`
        <label
          class="protvista_checkbox ${isCompound ? "compound" : ""}"
          tabindex="0"
        >
          <input
            type="checkbox"
            class="protvista_checkbox_input"
            ?checked="true"
            .value="${name}"
            @change="${() => super.toggleFilter(name)}"
          />
          <span
            class="checkmark"
            style=${`background: ${isCompound
                ? `
              linear-gradient(${options.colors[0]},
              ${options.colors[1]})
            `
                : options.colors[0]
            };`}
          ></span><div>
          ${labels.map((label: string) => {
                return html`<div class="protvista_checkbox_label">
              ${label}
            </div>`
            })}
            </div>
        </label>
      `;
        return result;
    }

    static get styles() {
        return [
            ProtvistaFilter.styles as CSSResult | number,
            css` .protvista_checkbox.compound .checkmark
        {
        align-self: stretch;
        height: auto;
        }`
        ];

    }
}

function getFilterByName(name: string) {
    for (let i = 0; i < filterCases.length; i++) {
        if (filterCases[i].name === name)
            return filterCases[i];
    }
}

function filterData(filterName: string, data: FilterVariationData[]) {
    var newData: FilterVariationData[] = [];
    const filter = getFilterByName(filterName);
    if (!filter) {
        return data;
    }
    data.forEach(feature => {
        const clonedVariants = Object.assign({}, feature);
        clonedVariants.variants = feature.variants.filter((variant: Variant) => {
            return filter.properties.every(property => {
                return property(variant);
            });
        });
        newData.push(clonedVariants);
    });
    return newData;
};

export const VariantColors = {
    UPDiseaseColor: '#990000',
    deleteriousColor: '#002594',
    benignColor: '#8FE3FF',
    UPNonDiseaseColor: '#99cc00',
    othersColor: '#FFCC00',
    unknownColor: '#808080',
    consequenceColors: ["#66c2a5", "#8da0cb", "#e78ac3", "#e5c494", "#fc8d62", "#ffd92f", "#a6d854", "#b3b3b3"],

    getPredictionColor: d3.scaleLinear<string>()
        .domain([0, 1])
        .range(['#002594', '#8FE3FF'])
}
type FilterCase = {
    name: string,
    type: {
        name: string,
        text: string
    },
    options: {
        labels: string[],
        colors: string[]
    },
    properties: ((variant: Variant) => boolean)[],
    filterData: (variants: FilterVariationData[]) => FilterVariationData[]
}
export const filterCases: FilterCase[] = [
    {
        name: 'disease',
        type: {
            name: "consequence",
            text: "Filter Consequence"
        },
        options: {
            labels: ["Disease (reviewed)"],
            colors: [VariantColors.UPDiseaseColor]
        },
        properties: [
            function (variant: Variant) {
                if (variant.association) { return variant.association?.some(association => association.disease === true); }
                return false;
            }
        ],
        filterData: function (variants: FilterVariationData[]) {
            return filterData("disease", variants);
        }
    },
    {
        name: 'prediction',
        type: {
            name: "consequence",
            text: "Filter Consequence"
        },
        options: {
            labels: ['Predicted deleterious', 'Predicted benign'],
            colors: [VariantColors.deleteriousColor, VariantColors.benignColor]
        },
        properties: [
            function (variant: Variant) {
                if (variant.alternativeSequence) return /[^*]/.test(variant.alternativeSequence);
                return false;
            },
            function (variant: Variant) {
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

        filterData: function (variants: FilterVariationData[]) {
            return filterData("prediction", variants);
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
            function (variant: Variant) {
                return variant.association?.every(association => {
                    return association.disease !== true;
                }) || (!variant.association);
            },
            function (variant: Variant) {
                return [
                    SourceType.UniProt,
                    SourceType.Mixed
                ].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],
        filterData: function (variants: FilterVariationData[]) {
            return filterData("nonDisease", variants);
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
            function (variant: Variant) {
                return variant.alternativeSequence === '*';
            }
        ],

        filterData: function (variants: FilterVariationData[]) {
            return filterData("uncertain", variants);
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
            function (variant) {
                if(!variant.predictions)return false;
                for (const prediction of variant.predictions) {
                    if (prediction.predAlgorithmNameType == PredAlgorithmNameType.PolyPhen||prediction.predAlgorithmNameType == PredAlgorithmNameType.Sift){
                        return false;
                    } 
                }
                return variant.association === undefined;
            },
            function (variant: Variant) {
                if (variant.alternativeSequence) return /[^*]/.test(variant.alternativeSequence);
                return false;
            },
            function (variant: Variant) {
                return [SourceType.LargeScaleStudy].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],
        filterData: function (variants: FilterVariationData[]) {
            return filterData("unknown", variants);
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
            function (variant: Variant) {
                return [SourceType.UniProt, SourceType.Mixed].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],

        filterData: function (variants: FilterVariationData[]) {
            return filterData("uniprot", variants);
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
        properties:[
            function (variant: Variant) {
                return [SourceType.LargeScaleStudy, SourceType.Mixed].some((orProp) => {
                    return variant.sourceType == orProp;
                });
            }
        ],
        filterData: function (variants: FilterVariationData[]) {
            return filterData("lss", variants);
        }
    },
];

type FilterVariationData = {
    type: string,
    normal: string,
    pos: number,
    variants: Variant[]
}



