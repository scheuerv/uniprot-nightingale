import { VariationData } from "../parsers/variation-parser";
import { createEmitter } from "ts-typed-events";
import CategoryContainer from "./category-container";
import BasicTrackContainer from "./track-container";
import { TrackFragment } from "./track-manager";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ColorConvert from "color-convert";
import VariationFilter from "../protvista/variation-filter";
import d3 = require('d3');

export default class VariationCategoryContainer implements CategoryContainer {
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private readonly variationColors = {
        min: 200,
        max: 50
    };
    private arrowMarked = false;
    constructor(
        private readonly variationGraph: BasicTrackContainer<VariationData>,
        private readonly variation: BasicTrackContainer<VariationData>,
        public protvistaFilter: VariationFilter,
        public mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>,
        private readonly _categoryDiv: HTMLDivElement
    ) {
        mainTrackRow.select(".fa-arrow-circle-right").on("click", () => {
            {
                d3.event.stopPropagation();
                const classList = d3.select(d3.event.target).node().classList;
                if (this.arrowMarked) {
                    classList.remove('clicked');
                    this.arrowMarked = false;
                    this.emitOnHighlightChange.emit([]);
                } else {
                    classList.add("clicked");
                    this.arrowMarked = true;
                    this.emitOnHighlightChange.emit(this.getFragments(this.variationGraph.track as ProtvistaVariationGraph));
                }
            }
        });
        protvistaFilter.addEventListener("change", (e) => {
            if (e instanceof CustomEvent && (e as CustomEvent).detail.type === 'filters' && e.detail.for === 'protvista-variation') {
                if (this.arrowMarked) {
                    this.emitOnHighlightChange.emit(this.getFragments(this.variationGraph.track as ProtvistaVariationGraph));
                }
            }
        });
    }
    public get trackContainers() {
        return [this.variationGraph, this.variation];
    }
    public get content(): HTMLElement {
        return this._categoryDiv;
    }
    public addData(): void {
        [this.variationGraph, this.variation].forEach(track => track.addData());
    }
    public getMarkedTrackFragments(): TrackFragment[] {
        if (this.arrowMarked) {
            return this.getFragments(this.variationGraph.track as ProtvistaVariationGraph);
        }
        else {
            return [];
        }
    }
    public getHighlightedTrackFragments(): TrackFragment[] {
        return [];
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
}