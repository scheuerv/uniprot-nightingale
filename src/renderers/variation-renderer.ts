import CategoryContainer from "../manager/category-container";
import TrackRenderer from "./track-renderer";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ProtvistaVariation from "protvista-variation";
import VariationFilter, { FilterCase } from "../protvista/variation-filter";
import BasicTrackContainer from "../manager/track-container";
import { createRow, markArrow } from "../utils";
import BasicCategoryContainer from "../manager/basic-category-container";
import d3 = require('d3');
import { VariationData } from "../parsers/variation-parser";
import { filterCases } from "../protvista/variation-filter";
import { TrackFragment } from "../manager/track-manager";
import { createEmitter } from "ts-typed-events";
import ColorConvert from "color-convert";
export default class VariationRenderer implements TrackRenderer {
    private variationGraph: BasicTrackContainer<VariationData>;
    private variation: BasicTrackContainer<VariationData>;
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    private emitOnArrowClick = createEmitter<TrackFragment[]>();
    public onArrowClick = this.emitOnArrowClick.event;
    private readonly variationColors = {
        min: 200,
        max: 50
    };
    constructor(private readonly data: VariationData, private mainTrackLabel: string) {

    }

    getCategoryContainer(sequence: string): CategoryContainer {
        const variationGraph = d3.create("protvista-variation-graph")
            .attr("highlight-event", "onmouseover")
            .attr("id", "protvista-variation-graph")
            .attr("length", sequence.length)
            .attr("height", 40).node() as ProtvistaVariationGraph;
        this.variationGraph = new BasicTrackContainer(variationGraph, this.data);
        const variation = d3.create("protvista-variation")
            .attr("id", "protvista-variation")
            .attr("length", sequence.length)
            .attr("highlight-event", "onmouseover");
        const variationTrack = variation.node() as ProtvistaVariation;
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
        this.mainTrackRow.attr("class", this.mainTrackRow.attr("class") + " data")
        this.mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle()
        );
        this.mainTrackRow.select(".fa-arrow-circle-right").on("click", () => {
            {
                d3.event.stopPropagation();
                if (markArrow()) {
                    this.emitOnArrowClick.emit(this.getFragments(variationGraph));
                }
                else {
                    this.emitOnArrowClick.emit([]);
                }
            }
        });
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
        protvistaFilter.addEventListener("change", (e) => {
            if (e instanceof CustomEvent && (e as CustomEvent).detail.type === 'filters') {
                const arrowClicked = this.mainTrackRow.select(".fa-arrow-circle-right.clicked").node();
                if (arrowClicked) {
                    this.emitOnArrowClick.emit(this.getFragments(variationGraph));
                }
            }
        });
        return new BasicCategoryContainer([this.variationGraph, this.variation], categoryDiv!);


    }
    private getFragments(variationGraph: ProtvistaVariationGraph): TrackFragment[] {
        const histogram = Array.from(variationGraph._totalsArray.total);
        const max = Math.max.apply(Math, histogram);
        const relativeHist = histogram.map(function (x) {
            return x / max;
        });
        const fragments = Array.from(relativeHist)
            .map((relative, index) => {
                const color = this.variationColors.min + (this.variationColors.max - this.variationColors.min) * relative;
                return {
                    start: index,
                    end: index,
                    color: '#' + ColorConvert.rgb.hex([color, color, color])
                }
            });
        return fragments;
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