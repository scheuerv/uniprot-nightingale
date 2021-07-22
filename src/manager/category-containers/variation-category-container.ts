import { createEmitter } from "ts-typed-events";
import CategoryContainer from "./category-container";
import VariationTrackContainer from "../track-containers/variation-track-container";
import ProtvistaVariationGraph from "protvista-variation-graph";
import ColorConvert from "color-convert";
import VariationFilter from "../../protvista/variation-filter";
import $ from "jquery";
import * as d3 from "d3";
import VariationGraphTrackContainer from "../track-containers/variation-graph-track-container";
import { TrackFragment } from "../../types/accession";
import { VariantWithSources } from "../../types/variants";
import { safeHexColor } from "../../utils/color-utils";
/**
 * Contains track containers with ProtvistaVariationGraph and ProtvistaVariation together with
 * ProtvistaFilter. Manages marked variants and updates them when filter changes.
 *
 */
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
                            this.getHistogramOfVariantsAsFragments(this.variationGraph.track)
                        );
                    }
                    return false;
                }
            });

        //When filter and arrow is mark we need to update highlights, because of different distribution.
        protvistaFilter.addEventListener("change", (e) => {
            if (
                e instanceof CustomEvent &&
                (e as CustomEvent).detail.type === "filters" &&
                e.detail.for === "protvista-variation"
            ) {
                if (this.arrowMarked) {
                    this.emitOnHighlightChange.emit(
                        this.getHistogramOfVariantsAsFragments(this.variationGraph.track)
                    );
                }
            }
        });
        this.variation.track.onRefreshed.on(() => {
            this.markedVariants.forEach((fragmnetWithElement) => {
                fragmnetWithElement.element.classList.add("clicked");
            });
        });
        //unmark variants when data are changed (because currently marked data might not be visible anymore).
        this.variation.track.onDataUpdated.on(() => {
            this.unmarkVariants();
            this.emitOnHighlightChange.emit([]);
        });
        $(protvistaFilter.parentElement!.parentElement!)
            .find(".fas.fa-redo")
            .on("click", () => {
                this.unmarkVariants();
                this.emitOnHighlightChange.emit([]);
            });

        //marking variants
        this.variation.track.addEventListener("change", (e) => {
            const event = e as CustomEvent;
            if (event.detail.eventtype == "click" && event.detail.feature) {
                const variant = event.detail.feature as VariantWithSources;
                const color = safeHexColor(variant.color);
                const trackFragment: TrackFragment = {
                    sequenceStart: parseInt(variant.begin),
                    sequenceEnd: parseInt(variant.end),
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
                this.emitOnHighlightChange.emit([trackFragment]);
            }
        });
    }

    /**
     * Variation track containers don't have any structure info.
     */
    public getFirstTrackContainerWithStructureInfo(): undefined {
        return undefined;
    }

    /**
     * Clears highlighted variants.
     */
    public clearHighlightedTrackFragments(): void {
        this.highlightedVariants.clear();
    }

    public get trackContainers(): (VariationGraphTrackContainer | VariationTrackContainer)[] {
        return [this.variationGraph, this.variation];
    }

    public get content(): HTMLElement {
        return this._categoryDiv;
    }

    /**
     * Set up data to VariationGraph and Variation
     */
    public addData(): void {
        [this.variationGraph, this.variation].forEach((track) => track.addData());
    }

    /**
     * It returns currently marked variants, but if the arrow is marked as well it creates
     * a histogram according to the variants distribution (and color of one item is calculated
     * as shade of gray from this histogram).
     */
    public getMarkedTrackFragments(): TrackFragment[] {
        if (this.arrowMarked) {
            return this.getHistogramOfVariantsAsFragments(this.variationGraph.track).concat(
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

    /**
     * Gets histogram from current variants (value of item is represented as shade
     *  of gray in TrackFragment)
     */
    private getHistogramOfVariantsAsFragments(
        variationGraph: ProtvistaVariationGraph
    ): TrackFragment[] {
        const histogram = [...variationGraph._totalsArray.total];
        const max = Math.max(...histogram);
        const relativeHist = histogram.map(function (x) {
            return x / max;
        });
        const fragments: TrackFragment[] = [...relativeHist].map((relative, index) => {
            const color =
                this.variationColors.min +
                (this.variationColors.max - this.variationColors.min) * relative;
            return {
                sequenceStart: index,
                sequenceEnd: index,
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
