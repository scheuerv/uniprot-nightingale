import CategoryContainer from "../manager/category-container";
import TrackRenderer from "./track-renderer";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ProtvistaVariation from "protvista-variation";
import VariationFilter, { FilterCase } from "../protvista/variation-filter";
import BasicTrackContainer from "../manager/track-container";
import { createRow } from "../utils";
import d3 = require('d3');
import { VariationData } from "../parsers/variation-parser";
import { filterCases } from "../protvista/variation-filter";
import VariationCategoryContainer from "../manager/variation-category-container";
export default class VariationRenderer implements TrackRenderer {
    private variationGraph: BasicTrackContainer<VariationData>;
    private variation: BasicTrackContainer<VariationData>;
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;

    constructor(private readonly data: VariationData, private readonly mainTrackLabel: string) {

    }

    getCategoryContainer(sequence: string): CategoryContainer {
        const variationGraph = d3.create("protvista-variation-graph")
            .attr("highlight-event", "onclick")
            .attr("id", "protvista-variation-graph")
            .attr("length", sequence.length)
            .attr("height", 40).node() as ProtvistaVariationGraph;
        this.variationGraph = new BasicTrackContainer(variationGraph, this.data);
        const variationTrack = d3.create("protvista-variation")
            .attr("id", "protvista-variation")
            .attr("length", sequence.length)
            .attr("highlight-event", "onclick").node() as ProtvistaVariation;
        variationTrack.colorConfig = function (e: any) {
            return "black";
        }

        this.variation = new BasicTrackContainer(variationTrack, this.data);
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