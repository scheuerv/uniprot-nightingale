import CategoryContainer from "../manager/category-container";
import TrackRenderer from "./track-renderer";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ProtvistaVariation from "protvista-variation";
import VariationFilter, { FilterCase } from "../protvista/variation-filter";
import VariationTrackContainer from "../manager/variation-track-container";
import { createRow } from "../utils";
import d3 = require('d3');
import { OtherSourceData, VariantWithSources, VariationData } from "../parsers/variation-parser";
import { filterCases } from "../protvista/variation-filter";
import VariationCategoryContainer from "../manager/variation-category-container";
import { createVariantTooltip } from "../tooltip-content";
export default class VariationRenderer implements TrackRenderer {
    private variationGraph: VariationTrackContainer;
    private variation: VariationTrackContainer;
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;

    constructor(
        private readonly data: VariationData,
        private readonly mainTrackLabel: string,
        public readonly categoryName: string,
        private readonly uniprotId: string,
        private readonly overwritePredictions?: boolean) {

    }
    public combine(other: TrackRenderer): TrackRenderer {
        if (other instanceof VariationRenderer) {
            return new VariationRenderer(
                { sequence: this.data.sequence, variants: this.combineVariants(this.data.variants, other.data.variants) },
                this.mainTrackLabel,
                this.categoryName,
                this.uniprotId,
                this.overwritePredictions)
        }
        else {
            throw new Error("Can't combine VariationRenderer with: " + (typeof other));
        }
    }

    public getCategoryContainer(sequence: string): CategoryContainer {
        const variationGraph = d3.create("protvista-variation-graph")
            .attr("highlight-event", "none")
            .attr("id", "protvista-variation-graph")
            .attr("length", sequence.length)
            .attr("height", 40).node() as ProtvistaVariationGraph;
        this.variationGraph = new VariationTrackContainer(variationGraph, this.data);
        const variationTrack = d3.create("protvista-variation")
            .attr("id", "protvista-variation")
            .attr("length", sequence.length)
            .attr("highlight-event", "none").node() as ProtvistaVariation;
        variationTrack.colorConfig = function (e: any) {
            return "black";
        }

        this.variation = new VariationTrackContainer(variationTrack, this.data);
        const categoryDiv = d3.create("div").node()!;
        this.mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            this.variationGraph.track,
            "main",
            true
        );
        this.mainTrackRow.attr("class", this.mainTrackRow.attr("class") + " main")
        this.mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle()
        );

        categoryDiv.appendChild(this.mainTrackRow.node()!);
        this.subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node()!;

        const protvistaFilter = d3.create("protvista-filter").node() as VariationFilter;
        const trackRowDiv = createRow(
            protvistaFilter,
            this.variation.track,
            "sub"
        );
        this.subtracksDiv.appendChild(trackRowDiv.node()!);
        categoryDiv.append(this.subtracksDiv!);
        protvistaFilter.filters = filterCases;
        protvistaFilter.multiFor = new Map();
        protvistaFilter.multiFor.set('protvista-variation-graph', (filterCase: FilterCase) => filterCase.filterDataVariationGraph);
        protvistaFilter.multiFor.set('protvista-variation', (filterCase: FilterCase) => filterCase.filterDataVariation);
        return new VariationCategoryContainer(this.variationGraph, this.variation, protvistaFilter, this.mainTrackRow, categoryDiv!);
    }
    private combineVariants(variants1: VariantWithSources[], variants2: VariantWithSources[]): VariantWithSources[] {
        const map: Map<string, VariantWithSources> = new Map();
        this.combineAllSources(variants1, map);
        this.combineAllSources(variants2, map);
        return Array.from(map.values());
    }

    private combineAllSources(variants: VariantWithSources[], map: Map<string, VariantWithSources>): void {
        variants.forEach(variant => {
            const key = `${variant.begin}-${variant.end}-${variant.alternativeSequence}`;
            const otherVariant = map.get(key);
            if (otherVariant) {
                const newVariant = this.combineSources(otherVariant, variant) ?? this.combineSources(variant, otherVariant);
                if (newVariant) {
                    map.set(key, newVariant);
                }
            }
            else {
                map.set(key, variant);
            }
        });
    }

    private combineSources(variant2: VariantWithSources, variant1: VariantWithSources) {
        if (variant1.customSource) {
            const newSources: Record<string, OtherSourceData> = {
                ...variant2.otherSources ?? {},
                ...variant1.otherSources ?? {}
            };
            newSources[variant1.customSource] = variant1;
            const newVariant: VariantWithSources = {
                ...variant2,
                tooltipContent: createVariantTooltip(variant2, this.uniprotId, newSources, this.overwritePredictions),
                otherSources: newSources
            };
            return newVariant;
        }
    }

    private toggle() {
        if (this.subtracksDiv!.style.display === 'none') {
            this.subtracksDiv!.style.display = 'block';
            this.mainTrackRow.select('.track-label.main').attr("class", "track-label main arrow-down");
        } else {
            this.subtracksDiv!.style.display = 'none';
            this.mainTrackRow.select('.track-label.main').attr('class', 'track-label main arrow-right');
        }
    }
};