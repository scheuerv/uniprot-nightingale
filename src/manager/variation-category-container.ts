import { createEmitter } from "ts-typed-events";
import CategoryContainer from "./category-container";
import VariationTrackContainer from "./variation-track-container";
import { TrackFragment } from "./track-manager";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ColorConvert from "color-convert";
import VariationFilter from "../protvista/variation-filter";
import d3 = require('d3');
import { TrackContainer } from "./track-container";
import { VariantWithSources } from "../parsers/variation-parser";

export default class VariationCategoryContainer implements CategoryContainer {
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    private readonly highlightedVariants: Map<string, TrackFragment> = new Map();
    private readonly markedVariants: Map<string, TrackFragment> = new Map();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;

    private readonly variationColors = {
        min: 200,
        max: 50
    };
    private arrowMarked = false;
    constructor(
        private readonly variationGraph: VariationTrackContainer,
        private readonly variation: VariationTrackContainer,
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
        this.variation.track.addEventListener("change", (e) => {
            const event = e as CustomEvent;
            if (event.detail.eventtype == 'click' && event.detail.feature) {
                const variant = event.detail.feature as VariantWithSources;
                const tokens = variant.color.split(/[,()]+/);
                const color = '#' + ColorConvert.rgb.hex([parseInt(tokens[1]), parseInt(tokens[2]), parseInt(tokens[3])])
                const trackFragment: TrackFragment = { start: parseInt(variant.begin), end: parseInt(variant.end), color: color };
                const key = `${variant.begin}:${variant.end}:${color}`;
                if (this.markedVariants.has(key)) {
                    this.highlightedVariants.delete(key);
                    this.markedVariants.delete(key)
                }
                else {
                    this.markedVariants.set(key, trackFragment);
                    if (d3.event.shiftKey) {
                        this.highlightedVariants.set(key, trackFragment);
                    }
                }
                this.emitOnHighlightChange([trackFragment]);
            }
        })
    }
    public getFirstTrackContainerWithOutput(): TrackContainer | undefined {
        return undefined;
    }
    public clearHighlightedTrackFragments() {
        this.highlightedVariants.clear();
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
            return this.getFragments(this.variationGraph.track as ProtvistaVariationGraph).concat(Array.from(this.markedVariants.values()));
        }
        else {
            return Array.from(this.markedVariants.values());
        }
    }
    public getHighlightedTrackFragments(): TrackFragment[] {
        return Array.from(this.highlightedVariants.values());
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