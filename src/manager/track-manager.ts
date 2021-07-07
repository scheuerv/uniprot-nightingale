import * as d3 from "d3";
import CategoryContainer from "./category-container";
import { createRow } from "../utils/utils";
import ProtvistaManager from "protvista-manager";
import { createEmitter } from "ts-typed-events";
import ProtvistaNavigation from "protvista-navigation";
import OverlayScrollbars from "overlayscrollbars";
import "overlayscrollbars/css/OverlayScrollbars.min.css";
import TrackContainer from "./track-container";
import TrackRenderer from "../renderers/track-renderer";
import { Fragment, Output, TrackFragment } from "../types/accession";
import { ElementWithData } from "./fragment-wrapper";
import { ChainMapping } from "../types/mapping";
import { Highlight } from "../types/highlight";
export default class TrackManager {
    private readonly emitOnResidueMouseOver = createEmitter<number>();
    public readonly onResidueMouseOver = this.emitOnResidueMouseOver.event;
    private readonly emitOnSelectedStructure = createEmitter<Output>();
    public readonly onSelectedStructure = this.emitOnSelectedStructure.event;
    private readonly emitOnFragmentMouseOut = createEmitter<void>();
    public readonly onFragmentMouseOut = this.emitOnFragmentMouseOut.event;
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private lastClickedFragment:
        | {
              fragment: ElementWithData;
              mouseX: number;
              mouseY: number;
          }
        | undefined;
    private readonly protvistaManagerD3 = d3
        .create("protvista-manager")
        .attr(
            "attributes",
            "length displaystart displayend highlightstart highlightend activefilters filters"
        );
    private readonly protvistaManager: ProtvistaManager =
        this.protvistaManagerD3.node()! as ProtvistaManager;
    private fixedHighlights = "";
    private clickedHighlights = "";
    private publicHighlights = "";
    private mouseoverHighlights = "";
    private readonly categoryContainers: CategoryContainer[] = [];
    private activeStructure?: ActiveStructure = undefined;

    constructor(element: HTMLElement, sequence: string, trackRenderers: TrackRenderer[]) {
        this.activeStructure = undefined;
        const navigationElement = d3.create("protvista-navigation").attr("length", sequence.length);
        this.protvistaManager.appendChild(
            createRow(d3.create("div").node()!, navigationElement.node()!).node()!
        );
        const sequenceElement = d3
            .create("protvista-sequence")
            .attr("length", sequence.length)
            .attr("sequence", sequence)
            .attr("numberofticks", 10);
        this.protvistaManager.appendChild(
            createRow(d3.create("div").node()!, sequenceElement.node()!).node()!
        );
        trackRenderers.forEach((renderer) => {
            const categoryContainer = renderer.getCategoryContainer(sequence);
            const trackContainer = categoryContainer.getFirstTrackContainerWithOutput();
            if (trackContainer && !this.activeStructure) {
                const output = trackContainer.getOutput()!;
                this.activeStructure = { trackContainer, output };
                this.activeStructure?.trackContainer.activate();
                const chainMapping = output.mapping[output.chain];
                this.setChainHighlights(chainMapping);
                this.emitOnSelectedStructure(output);
            }
            this.categoryContainers.push(categoryContainer);
            this.protvistaManager.appendChild(categoryContainer.content);
        });

        element.appendChild(this.protvistaManager);
        this.categoryContainers.forEach((categoryContainer) => {
            categoryContainer.trackContainers.forEach((trackContainer) => {
                trackContainer.onLabelClick.on((output) => {
                    if (
                        this.activeStructure?.trackContainer == trackContainer &&
                        this.activeStructure.output == output
                    ) {
                        return;
                    }
                    this.activeStructure?.trackContainer.deactivate();
                    this.activeStructure = {
                        trackContainer,
                        output
                    };
                    this.activeStructure.trackContainer.activate();
                    const chainMapping = output.mapping[output.chain];
                    this.setChainHighlights(chainMapping);
                    this.emitOnSelectedStructure(output);
                });
                trackContainer.track.addEventListener("click", (e) => {
                    if (!(e.target as Element).closest(".feature")) {
                        this.removeAllTooltips();
                        this.highlightOff();
                    }
                });

                trackContainer.track.addEventListener("change", (e) => {
                    const event = e as CustomEvent;
                    const detail: EventDetail = event.detail;
                    this.updateTooltip(detail, resizeObserver);
                    if (detail?.eventtype == "click") {
                        const output = detail.target?.__data__?.output;
                        if (output) {
                            if (
                                this.activeStructure?.trackContainer == trackContainer &&
                                this.activeStructure.output == output
                            ) {
                                return;
                            }
                            this.activeStructure?.trackContainer.deactivate();
                            this.activeStructure = {
                                trackContainer,
                                output
                            };
                            this.activeStructure.trackContainer.activate();
                            const chainMapping = output.mapping[output.chain];
                            this.setChainHighlights(chainMapping);
                            this.emitOnSelectedStructure(output);
                        }
                    }
                });
            });
            categoryContainer.onHighlightChange.on(() => {
                const highligtedFragments = this.categoryContainers.flatMap((categoryContainer) =>
                    categoryContainer.getHighlightedTrackFragments()
                );
                this.clickedHighlights = highligtedFragments
                    .map((fragment) => {
                        return `${fragment.start}:${fragment.end}:${
                            fragment.color.length >= 7
                                ? fragment.color.slice(0, 7).concat("66")
                                : fragment.color
                        }`;
                    })
                    .join(",");
                this.applyHighlights();
                this.emitOnHighlightChange.emit(
                    this.categoryContainers.flatMap((categoryContainer) =>
                        categoryContainer.getMarkedTrackFragments()
                    )
                );
            });
            categoryContainer.addData();
        });
        const resizeObserver = new ResizeObserver(() => {
            if (this.lastClickedFragment) {
                const boundingRect = this.lastClickedFragment.fragment.getBoundingClientRect();
                if (boundingRect.width == 0) {
                    resizeObserver.unobserve(this.lastClickedFragment.fragment);
                    this.lastClickedFragment = undefined;
                    this.removeAllTooltips();
                } else {
                    const mouseX = boundingRect.width * this.lastClickedFragment.mouseX;
                    const mouseY = boundingRect.height * this.lastClickedFragment.mouseY;
                    this.protvistaManagerD3
                        .select("protvista-tooltip")
                        .attr("x", boundingRect.x + mouseX)
                        .attr("y", boundingRect.y + mouseY)
                        .attr("visible", "");
                }
            }
        });
        OverlayScrollbars(document.querySelectorAll(".subtracks-container.scrollable"), {
            resize: "vertical",
            paddingAbsolute: true,
            scrollbars: {
                clickScrolling: true,
                autoHide: "leave"
            }
        });
        resizeObserver.observe(element);
        const protvistaNavigation = this.protvistaManagerD3
            .select("protvista-navigation")
            .node() as ProtvistaNavigation;
        let lastFocusedResidue: number | undefined;
        this.protvistaManagerD3
            .selectAll("protvista-variation")
            .on("change", () => {
                const detail = d3.event.detail;
                if (detail.eventtype == "mouseover") {
                    const feature = detail.feature as {
                        start: number;
                        end: number;
                    };
                    const residueNumber = feature.start;
                    if (lastFocusedResidue != residueNumber) {
                        lastFocusedResidue = residueNumber;
                        this.mouseoverHighlights = `${residueNumber}:${residueNumber}`;
                        this.applyHighlights();
                        this.emitOnResidueMouseOver.emit(residueNumber);
                    }
                }
            })
            .on("mouseout", () => {
                lastFocusedResidue = undefined;
                this.mouseoverHighlights = "";
                this.applyHighlights();
                this.emitOnFragmentMouseOut.emit();
            });
        this.protvistaManagerD3
            .selectAll("protvista-track g.fragment-group")
            .on("mousemove", (f) => {
                const feature = f as { start: number; end: number };
                const xScale = d3
                    .scaleLinear<number>()
                    .domain([0, protvistaNavigation.width - 2 * protvistaNavigation._padding])
                    .rangeRound([
                        parseInt(protvistaNavigation._displaystart),
                        parseInt(protvistaNavigation._displayend) + 1
                    ]);

                // console.log(e.offsetX - protvistaNavigation._padding);
                // console.log(e.offsetX);
                const residueNumber = Math.max(
                    Math.min(xScale(d3.event.offsetX - protvistaNavigation._padding), feature.end),
                    feature.start
                );
                if (lastFocusedResidue != residueNumber) {
                    lastFocusedResidue = residueNumber;
                    this.mouseoverHighlights = `${residueNumber}:${residueNumber}`;
                    this.applyHighlights();
                    this.emitOnResidueMouseOver.emit(residueNumber);
                }
            })
            .on("mouseout", () => {
                lastFocusedResidue = undefined;
                this.mouseoverHighlights = "";
                this.applyHighlights();
                this.emitOnFragmentMouseOut.emit();
            });
    }

    public setHighlights(highlights: Highlight[]): void {
        this.publicHighlights = highlights
            .map((highlight) => {
                return `${highlight.start}:${highlight.end}${
                    highlight.color ? ":" + highlight.color : ""
                }`;
            })
            .join(",");
        this.applyHighlights();
    }

    public clearHighlights(): void {
        this.publicHighlights = "";
        this.applyHighlights();
    }

    public getMarkedFragments(): TrackFragment[] {
        return this.categoryContainers.flatMap((categoryContainer) =>
            categoryContainer.getMarkedTrackFragments()
        );
    }

    private setChainHighlights(chainMapping?: ChainMapping) {
        if (chainMapping) {
            this.setFixedHighlights([
                {
                    start: Math.min(
                        ...chainMapping.fragmentMappings.map((mapping) => mapping.sequenceStart)
                    ),
                    end: Math.max(
                        ...chainMapping.fragmentMappings.map((mapping) => mapping.sequenceEnd)
                    ),
                    color: "#0000001A"
                }
            ]);
        }
    }

    private highlightOff(): void {
        this.publicHighlights = "";
        this.clickedHighlights = "";
        this.categoryContainers.forEach((trackContainer) =>
            trackContainer.clearHighlightedTrackFragments()
        );
        this.applyHighlights();
    }

    private setFixedHighlights(highlights: Highlight[]): void {
        this.fixedHighlights = highlights
            .map((highlight) => {
                return `${highlight.start}:${highlight.end}${
                    highlight.color ? ":" + highlight.color : ""
                }`;
            })
            .join(",");
        this.applyHighlights();
    }

    private applyHighlights(): void {
        this.protvistaManager.highlight = `${this.fixedHighlights ?? ""}${
            this.clickedHighlights ? "," + this.clickedHighlights : ""
        }${this.publicHighlights ? "," + this.publicHighlights : ""}${
            this.mouseoverHighlights ? "," + this.mouseoverHighlights : ""
        }`;
        this.protvistaManager.applyAttributes();
    }

    private updateTooltip(detail: EventDetail, resizeObserver: ResizeObserver): void {
        const previousTooltip = this.protvistaManagerD3.select("protvista-tooltip");
        if (detail.eventtype == "mouseout") {
            if (previousTooltip.empty() || !previousTooltip.classed("click-open")) {
                this.removeAllTooltips();
            }
            return;
        }
        if (detail.eventtype == "click") {
            this.createTooltip(detail, resizeObserver, true);
            return;
        }
        if (detail.eventtype == "mouseover") {
            if (previousTooltip.empty() || !previousTooltip.classed("click-open")) {
                this.removeAllTooltips();
                this.createTooltip(detail, resizeObserver);
            }
            return;
        }
        this.removeAllTooltips();
    }

    private createTooltip(
        detail: EventDetail,
        resizeObserver: ResizeObserver,
        closeable = false
    ): void {
        if (this.lastClickedFragment) {
            resizeObserver.unobserve(this.lastClickedFragment.fragment);
            this.lastClickedFragment = undefined;
        }
        if (detail.target) {
            const fragment: Fragment = detail.target.__data__;
            this.protvistaManagerD3
                .selectAll("protvista-tooltip")
                .data([fragment])
                .enter()
                .append("protvista-tooltip");
            this.protvistaManagerD3
                .selectAll("protvista-tooltip")
                .attr("x", detail.coords[0])
                .attr("y", detail.coords[1])
                .attr("title", fragment.tooltipContent?.title ?? "")
                .attr("visible", true)
                .html(fragment.tooltipContent?.content ?? "");
            if (closeable) {
                const fragment: ElementWithData = detail.target;
                const boundingRect: DOMRect = fragment.getBoundingClientRect();
                const mouseX: number = (detail.coords[0] - boundingRect.x) / boundingRect.width;
                const mouseY: number = (detail.coords[1] - boundingRect.y) / boundingRect.height;
                this.lastClickedFragment = {
                    fragment: fragment,
                    mouseX: mouseX,
                    mouseY: mouseY
                };
                resizeObserver.observe(this.lastClickedFragment.fragment);
                this.protvistaManagerD3.select("protvista-tooltip").classed("click-open", true);
            }
        }
    }

    private removeAllTooltips(): void {
        this.protvistaManagerD3.selectAll("protvista-tooltip").remove();
    }
}
type ActiveStructure = {
    readonly trackContainer: TrackContainer;
    readonly output: Output;
};

type EventDetail = {
    readonly eventtype: string;
    readonly coords: number[];
    readonly target: ElementWithData | undefined;
};
