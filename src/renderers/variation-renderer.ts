import CategoryContainer from "../manager/category-container";
import TrackRenderer from "./track-renderer";
import ProtvistaVariationGraph from "protvista-variation-graph";
import VariationTrackContainer from "../manager/variation-track-container";
import { createRow } from "../utils";
import * as d3 from "d3";
import VariationFilter from "../protvista/variation-filter";
import VariationCategoryContainer from "../manager/variation-category-container";
import { createVariantTooltip } from "../tooltip-content";
import FixedProtvistaVariation from "../protvista/variation";
import VariationGraphTrackContainer from "../manager/variation-graph-track-container";
import {
    filterCases,
    filterDataVariation,
    filterDataVariationGraph,
    variantsFill
} from "../variants-utils";
import { VariationData, VariantWithSources, OtherSourceData } from "../types/variants";
import { FilterCase, FilterVariationData } from "../types/variation-filter";
export default class VariationRenderer implements TrackRenderer {
    private variationGraph: VariationGraphTrackContainer;
    private variation: VariationTrackContainer;
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;

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

    public getCategoryContainer(sequence: string): CategoryContainer {
        const variationGraph = d3
            .create("protvista-variation-graph")
            .attr("highlight-event", "none")
            .attr("id", "protvista-variation-graph")
            .attr("length", sequence.length)
            .attr("height", 40)
            .node() as ProtvistaVariationGraph;
        this.variationGraph = new VariationGraphTrackContainer(variationGraph, this.data);
        const variationTrack = d3
            .create("protvista-variation")
            .attr("id", "protvista-variation")
            .attr("length", sequence.length)
            .attr("highlight-event", "none")
            .node() as FixedProtvistaVariation;
        variationTrack.colorConfig = function () {
            return "black";
        };

        this.variation = new VariationTrackContainer(variationTrack, this.data);
        const categoryDiv = d3.create("div").node()!;
        this.mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            this.variationGraph.track,
            "main",
            true
        );
        this.mainTrackRow.attr("class", this.mainTrackRow.attr("class") + " main");
        this.mainTrackRow
            .select(".track-label")
            .attr("class", "track-label main arrow-right")
            .on("click", () => this.toggle());

        categoryDiv.appendChild(this.mainTrackRow.node()!);
        this.subtracksDiv = d3
            .create("div")
            .attr("class", "subtracks-container")
            .style("display", "none")
            .node()!;
        const protvistaFilter = d3.create("protvista-filter").node() as VariationFilter;
        const trackRowDiv = createRow(protvistaFilter, this.variation.track, "sub");
        trackRowDiv.select(".track-label").insert("i", ":first-child").attr("class", "fas fa-redo");
        this.subtracksDiv.appendChild(trackRowDiv.node()!);
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
            .concat(Array.from(customSources.values()))
            .concat(Array.from(customConsequences.values()));
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
            categoryDiv,
            protvistaFilter,
            this.mainTrackRow
        );
    }

    private combineVariants(variants1: VariationData, variants2: VariationData): VariationData {
        const map: Map<string, VariantWithSources> = new Map();
        this.combineAllSources(variants1.variants, map);
        this.combineAllSources(variants2.variants, map);
        return {
            sequence: variants1.sequence,
            customSources: variants1.customSources.concat(variants2.customSources),
            variants: Array.from(map.values())
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
        if (this.subtracksDiv.style.display === "none") {
            this.subtracksDiv.style.display = "block";
            this.mainTrackRow
                .select(".track-label.main")
                .attr("class", "track-label main arrow-down");
        } else {
            this.subtracksDiv.style.display = "none";
            this.mainTrackRow
                .select(".track-label.main")
                .attr("class", "track-label main arrow-right");
        }
    }
}
