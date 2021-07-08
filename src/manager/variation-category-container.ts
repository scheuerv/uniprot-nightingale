import { createEmitter } from "ts-typed-events";
import CategoryContainer from "./category-container";
import VariationTrackContainer from "./variation-track-container";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ColorConvert from "color-convert";
import VariationFilter from "../protvista/variation-filter";
import $ from "jquery";
import * as d3 from "d3";
import VariationGraphTrackContainer from "./variation-graph-track-container";
import { TrackFragment } from "../types/accession";
import { VariantWithSources } from "../types/variants";
import { safeHexColor } from "../utils/color-utils";

export default class VariationCategoryContainer implements CategoryContainer {
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private readonly highlightedVariants: Map<string, TrackFragment> = new Map();
    private readonly markedVariants: Map<string, TrackFragmentWithElement> = new Map();
    private readonly variationColors = {
        min: 200,
        max: 50
    };
    private arrowMarked = false;

    constructor(
        private readonly variationGraph: VariationGraphTrackContainer,
        private readonly variation: VariationTrackContainer,
        private readonly _categoryDiv: HTMLElement,
        protvistaFilter: VariationFilter,
        mainTrackRow: HTMLElement
    ) {
        $(mainTrackRow)
            .find(".fa-arrow-circle-right")
            .on("click", (e) => {
                {
                    const target = $(e.target);
                    if (this.arrowMarked) {
                        target.removeClass("clicked");
                        this.arrowMarked = false;
                        this.emitOnHighlightChange.emit([]);
                    } else {
                        target.addClass("clicked");
                        this.arrowMarked = true;
                        this.emitOnHighlightChange.emit(
                            this.getFragments(this.variationGraph.track)
                        );
                    }
                    return false;
                }
            });
        protvistaFilter.addEventListener("change", (e) => {
            if (
                e instanceof CustomEvent &&
                (e as CustomEvent).detail.type === "filters" &&
                e.detail.for === "protvista-variation"
            ) {
                if (this.arrowMarked) {
                    this.emitOnHighlightChange.emit(this.getFragments(this.variationGraph.track));
                }
            }
        });
        this.variation.track.onRefreshed.on(() => {
            this.markedVariants.forEach((fragmnetWithElement) => {
                fragmnetWithElement.element.classList.add("clicked");
            });
        });
        this.variation.track.onDataUpdated.on(() => {
            this.unmarkVariants();
            this.emitOnHighlightChange([]);
        });
        $(protvistaFilter.parentElement!.parentElement!)
            .find(".fas.fa-redo")
            .on("click", () => {
                this.unmarkVariants();
                this.emitOnHighlightChange([]);
            });
        this.variation.track.addEventListener("change", (e) => {
            const event = e as CustomEvent;
            if (event.detail.eventtype == "click" && event.detail.feature) {
                const variant = event.detail.feature as VariantWithSources;
                const color = safeHexColor(variant.color);
                const trackFragment: TrackFragment = {
                    start: parseInt(variant.begin),
                    end: parseInt(variant.end),
                    color: color
                };
                const key = `${variant.begin}:${variant.end}:${color}:${variant.alternativeSequence}`;
                const target = event.detail.target as HTMLElement;
                const classList = target.classList;
                if (classList.contains("clicked")) {
                    classList.remove("clicked");
                } else {
                    classList.add("clicked");
                }
                if (this.markedVariants.has(key)) {
                    this.highlightedVariants.delete(key);
                    this.markedVariants.delete(key);
                } else {
                    this.markedVariants.set(key, {
                        trackFragment: trackFragment,
                        element: target
                    });
                    if (d3.event.shiftKey) {
                        this.highlightedVariants.set(key, trackFragment);
                    }
                }
                this.emitOnHighlightChange([trackFragment]);
            }
        });
    }

    public getFirstTrackContainerWithOutput(): undefined {
        return undefined;
    }

    public clearHighlightedTrackFragments(): void {
        this.highlightedVariants.clear();
    }

    public get trackContainers(): (VariationGraphTrackContainer | VariationTrackContainer)[] {
        return [this.variationGraph, this.variation];
    }

    public get content(): HTMLElement {
        return this._categoryDiv;
    }

    public addData(): void {
        [this.variationGraph, this.variation].forEach((track) => track.addData());
    }

    public getMarkedTrackFragments(): TrackFragment[] {
        if (this.arrowMarked) {
            return this.getFragments(this.variationGraph.track).concat(
                [...this.markedVariants.values()].map((t) => t.trackFragment)
            );
        } else {
            return [...this.markedVariants.values()].map(
                (fragmentWithElement) => fragmentWithElement.trackFragment
            );
        }
    }

    public getHighlightedTrackFragments(): TrackFragment[] {
        return [...this.highlightedVariants.values()];
    }

    private unmarkVariants(): void {
        this.markedVariants.forEach((trackFragmentWithElement) => {
            trackFragmentWithElement.element.classList.remove("clicked");
        });
        this.markedVariants.clear();
        this.clearHighlightedTrackFragments();
    }

    private getFragments(variationGraph: ProtvistaVariationGraph): TrackFragment[] {
        const histogram = [...variationGraph._totalsArray.total];
        const max = Math.max(...histogram);
        const relativeHist = histogram.map(function (x) {
            return x / max;
        });
        const fragments = [...relativeHist].map((relative, index) => {
            const color =
                this.variationColors.min +
                (this.variationColors.max - this.variationColors.min) * relative;
            return {
                start: index,
                end: index,
                color: "#" + ColorConvert.rgb.hex([color, color, color])
            };
        });
        return fragments;
    }
}

type TrackFragmentWithElement = {
    trackFragment: TrackFragment;
    element: HTMLElement;
};
