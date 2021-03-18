import CategoryContainer from "../manager/category-container";
import TrackRenderer from "./track-renderer";
//@ts-ignore
import ProtvistaVariationGraph from "protvista-variation-graph";
//@ts-ignore
import ProtvistaVariation from "protvista-variation";
//@ts-ignore
import ProtvistaFilter from "protvista-filter";

import BasicTrackContainer from "../manager/track-container";
import { createRow } from "../utils";
import BasicCategoryContainer from "../manager/basic-category-container";
import d3 = require('d3');
import { VariationData } from "../parsers/variation-parser";
import { filterCases } from "../variation-filter";

export default class VariationRenderer implements TrackRenderer {
    private variationGraph: BasicTrackContainer<VariationData>;
    private variation: BasicTrackContainer<VariationData>;
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    constructor(private data: VariationData, private mainTrackLabel: string) {

    }
    getCategoryContainer(sequence: string): CategoryContainer {
        const variationGraph = d3.create("protvista-variation-graph")
            .attr("highlight-event", "onmouseover")
            .attr("length", sequence.length)
            .attr("height", 40);
        this.variationGraph = new BasicTrackContainer((variationGraph.node() as any) as ProtvistaVariationGraph, this.data);
        const variation = d3.create("protvista-variation")
            .attr("id", "variation-graph")
            .attr("length", sequence.length)
            .attr("highlight-event", "onmouseover");
        const variationTrack = (variation.node() as any) as ProtvistaVariation;
        variationTrack.colorConfig = function (e: any) {
            return "black";
        }

        this.variation = new BasicTrackContainer(variationTrack, this.data);
        const categoryDiv = d3.create("div").node()!;

        this.mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            this.variationGraph.track as any,
            "main"
        );
        this.mainTrackRow.attr("class", this.mainTrackRow.attr("class") + " data")
        this.mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle()
        );
        categoryDiv.appendChild(this.mainTrackRow.node()!);
        this.subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node()!;

        const protvistaFilter = d3.create("protvista-filter").attr("for", "variation-graph").node()!;
        const trackRowDiv = createRow(
            protvistaFilter,
            this.variation.track as any,
            "sub"
        );
        this.subtracksDiv.appendChild(trackRowDiv.node() as any);
        categoryDiv.append(this.subtracksDiv!);
        (protvistaFilter as ProtvistaFilter).filters = filterCases;
        return new BasicCategoryContainer([this.variationGraph, this.variation], categoryDiv!);


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