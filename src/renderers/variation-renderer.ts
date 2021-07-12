import TrackRenderer from "./track-renderer";
import ProtvistaVariationGraph from "protvista-variation-graph";
import VariationTrackContainer from "../manager/variation-track-container";
import { createRow } from "../utils/utils";
import $ from "jquery";
import VariationFilter from "../protvista/variation-filter";
import VariationCategoryContainer from "../manager/variation-category-container";
import { createVariantTooltip } from "../tooltip-content";
import FixedProtvistaVariation from "../protvista/variation";
import VariationGraphTrackContainer from "../manager/variation-graph-track-container";
import {
    filterDataVariation,
    filterDataVariationGraph,
    variantsFill
} from "../utils/variants-utils";
import { VariationData, VariantWithSources, OtherSourceData } from "../types/variants";
import { FilterCase, FilterVariationData } from "../types/variation-filter";
import { filterCases } from "../config/filter-cases";
export default class VariationRenderer implements TrackRenderer {
    private variationGraph: VariationGraphTrackContainer;
    private variation: VariationTrackContainer;
    private subtracksDiv: JQuery<HTMLElement>;
    private mainTrackRow: JQuery<HTMLElement>;

    constructor(
        private readonly data: VariationData,
        private readonly mainTrackLabel: string,
        public readonly categoryName: string,
        private readonly uniprotId: string,
        private readonly overwritePredictions?: boolean
    ) {}

    public combine(other: TrackRenderer): TrackRenderer {
        if (other instanceof VariationRenderer) {
            return new VariationRenderer(
                this.combineVariants(this.data, other.data),
                this.mainTrackLabel,
                this.categoryName,
                this.uniprotId,
                this.overwritePredictions
            );
        } else {
            throw new Error("Can't combine VariationRenderer with: " + typeof other);
        }
    }

    public createCategoryContainer(sequence: string): VariationCategoryContainer {
        const variationGraph = $("<protvista-variation-graph/>")
            .attr("highlight-event", "none")
            .attr("id", "protvista-variation-graph")
            .attr("length", sequence.length)
            .attr("height", 40)[0] as ProtvistaVariationGraph;
        this.variationGraph = new VariationGraphTrackContainer(variationGraph, this.data);
        const variationTrack = $("<protvista-variation/>")
            .attr("id", "protvista-variation")
            .attr("length", sequence.length)
            .attr("highlight-event", "none")[0] as FixedProtvistaVariation;
        variationTrack.colorConfig = function () {
            return "black";
        };

        this.variation = new VariationTrackContainer(variationTrack, this.data);
        const categoryDiv = $("<div/>");
        this.mainTrackRow = createRow(
            $(document.createTextNode(this.mainTrackLabel)),
            $(this.variationGraph.track),
            "main",
            true
        );
        this.mainTrackRow.addClass("main");
        $(this.mainTrackRow)
            .find(".track-label")
            .addClass("arrow-right")
            .on("click", () => this.toggle());

        categoryDiv.append(this.mainTrackRow);
        this.subtracksDiv = $("<div/>").addClass("subtracks-container").css("display", "none");
        const protvistaFilter = $("<protvista-filter/>")[0] as VariationFilter;
        const trackRowDiv = createRow($(protvistaFilter), $(this.variation.track), "sub");
        $(trackRowDiv)
            .find(".track-label")
            .prepend($("<i/>", { class: "fas fa-redo" }));
        this.subtracksDiv.append(trackRowDiv);
        categoryDiv.append(this.subtracksDiv);
        const customSources: Map<string, FilterCase> = new Map();
        const customConsequences: Map<string, FilterCase> = new Map();
        this.data.variants.forEach((variant) => {
            if (variant.otherSources) {
                for (const source in variant.otherSources) {
                    const consequence = variant.otherSources[source].consequenceType;
                    if (consequence && !customConsequences.has(consequence)) {
                        const filterCase: FilterCase = {
                            name: consequence,
                            type: {
                                name: "consequence",
                                text: "Filter Consequence"
                            },
                            options: {
                                labels: [consequence],
                                colors: ["grey"]
                            },
                            properties: [
                                function (filteredVariant: VariantWithSources) {
                                    for (const source in filteredVariant.otherSources) {
                                        const filteredVariantConsequence =
                                            filteredVariant.otherSources[source].consequenceType;
                                        if (filteredVariantConsequence == consequence) {
                                            return true;
                                        }
                                    }
                                    return false;
                                }
                            ],
                            filterDataVariation: function (variants: FilterVariationData[]) {
                                return filterDataVariation(filterCase, variants);
                            },
                            filterDataVariationGraph: function (variants: VariationData) {
                                return filterDataVariationGraph(filterCase, variants);
                            }
                        };
                        customConsequences.set(consequence, filterCase);
                    }
                }
            }
        });
        this.data.customSources.forEach((customSource) => {
            const filterCase: FilterCase = {
                name: customSource,
                type: {
                    name: "dataSource",
                    text: "Filter data source"
                },
                options: {
                    labels: [customSource],
                    colors: ["grey"]
                },
                properties: [
                    function (variant: VariantWithSources) {
                        if (variant.customSource == customSource) {
                            return true;
                        }
                        for (const source in variant.otherSources) {
                            if (source == customSource) {
                                return true;
                            }
                        }
                        return false;
                    }
                ],
                filterDataVariation: function (variants: FilterVariationData[]) {
                    return filterDataVariation(filterCase, variants);
                },
                filterDataVariationGraph: function (variants: VariationData) {
                    return filterDataVariationGraph(filterCase, variants);
                }
            };
            customSources.set(customSource, filterCase);
        });

        protvistaFilter.filters = filterCases
            .concat([...customSources.values()])
            .concat([...customConsequences.values()]);
        protvistaFilter.multiFor = new Map();
        protvistaFilter.multiFor.set(
            "protvista-variation-graph",
            (filterCase: FilterCase) => filterCase.filterDataVariationGraph
        );
        protvistaFilter.multiFor.set(
            "protvista-variation",
            (filterCase: FilterCase) => filterCase.filterDataVariation
        );
        return new VariationCategoryContainer(
            this.variationGraph,
            this.variation,
            categoryDiv[0],
            protvistaFilter,
            this.mainTrackRow[0]
        );
    }

    private combineVariants(variants1: VariationData, variants2: VariationData): VariationData {
        const map: Map<string, VariantWithSources> = new Map();
        this.combineAllSources(variants1.variants, map);
        this.combineAllSources(variants2.variants, map);
        return {
            sequence: variants1.sequence,
            customSources: variants1.customSources.concat(variants2.customSources),
            variants: [...map.values()]
        };
    }

    private combineAllSources(
        variants: VariantWithSources[],
        map: Map<string, VariantWithSources>
    ): void {
        variants.forEach((variant) => {
            const key = `${variant.begin}-${variant.end}-${variant.alternativeSequence}`;
            const otherVariant = map.get(key);
            if (otherVariant) {
                const newVariant =
                    this.combineSources(otherVariant, variant) ??
                    this.combineSources(variant, otherVariant);
                if (newVariant) {
                    map.set(key, newVariant);
                }
            } else {
                map.set(key, variant);
            }
        });
    }

    private combineSources(variant2: VariantWithSources, variant1: VariantWithSources) {
        if (variant1.customSource) {
            const newSources: Record<string, OtherSourceData> = {
                ...(variant2.otherSources ?? {}),
                ...(variant1.otherSources ?? {})
            };
            newSources[variant1.customSource] = variant1;
            const newVariant: VariantWithSources = {
                ...variant2,
                tooltipContent: createVariantTooltip(
                    variant2,
                    this.uniprotId,
                    newSources,
                    this.overwritePredictions
                ),
                color: variantsFill(variant2, newSources, this.overwritePredictions),
                otherSources: newSources
            };
            return newVariant;
        }
    }

    private toggle() {
        if (this.subtracksDiv.css("display") === "none") {
            this.subtracksDiv.css("display", "block");
            $(this.mainTrackRow)
                .find(".track-label.main")
                .removeClass("arrow-right")
                .addClass("arrow-down");
        } else {
            this.subtracksDiv.css("display", "none");
            $(this.mainTrackRow)
                .find(".track-label.main")
                .removeClass("arrow-down")
                .addClass("arrow-right");
        }
    }
}
