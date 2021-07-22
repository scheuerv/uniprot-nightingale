import * as d3 from "d3";
import $ from "jquery";
import CategoryContainer from "./category-containers/category-container";
import { createRow } from "../utils/utils";
import ProtvistaManager from "protvista-manager";
import { createEmitter } from "ts-typed-events";
import ProtvistaNavigation from "protvista-navigation";
import OverlayScrollbars from "overlayscrollbars";
import "overlayscrollbars/css/OverlayScrollbars.min.css";
import TrackContainer from "./track-containers/track-container";
import { Fragment, StructureInfo, TrackFragment } from "../types/accession";
import { HTMLElementWithData } from "./fragment-wrapper";
import { ChainMapping } from "../types/mapping";
import { Highlight } from "../types/highlight";

/**
 * Main class of uniprot-nightingale module. It manages all of its "runtime" components.
 * The easiest way to create your very own TrackManager is to use TrackManagerBuilder.
 *
 * It manages tooltip (hides/displays and moves), different independent sources of
 * highlights and contains ProtvistaManager into which it inserts all of its
 * tracks containing other nightingale (ProtVista) components.
 *
 */
export default class TrackManager {
    private readonly emitOnResidueMouseOver = createEmitter<number>();
    public readonly onResidueMouseOver = this.emitOnResidueMouseOver.event;
    private readonly emitOnSelectedStructure = createEmitter<StructureInfo>();
    public readonly onSelectedStructure = this.emitOnSelectedStructure.event;
    private readonly emitOnFragmentMouseOut = createEmitter<void>();
    public readonly onFragmentMouseOut = this.emitOnFragmentMouseOut.event;
    private readonly emitOnMarkChange = createEmitter<TrackFragment[]>();
    public readonly onMarkChange = this.emitOnMarkChange.event;
    private lastClickedFragment:
        | {
              fragment: HTMLElementWithData;
              mouseX: number;
              mouseY: number;
          }
        | undefined;
    private readonly protvistaManager = $("<protvista-manager/>").attr(
        "attributes",
        "length displaystart displayend highlightstart highlightend activefilters filters"
    ) as JQuery<ProtvistaManager>;
    private fixedHighlights = "";
    private clickedHighlights = "";
    private publicHighlights = "";
    private mouseoverHighlights = "";
    private readonly categoryContainers: CategoryContainer[] = [];
    private activeStructure?: ActiveStructure = undefined;

    constructor(element: HTMLElement, sequence: string, categoryContainers: CategoryContainer[]) {
        this.categoryContainers = categoryContainers;
        const navigationElement = $("<protvista-navigation/>").attr("length", sequence.length);
        this.protvistaManager.append(createRow($("<div/>"), navigationElement));
        const sequenceElement = $("<protvista-sequence/>")
            .attr("length", sequence.length)
            .attr("sequence", sequence)
            .attr("numberofticks", 10);
        this.protvistaManager.append(createRow($("<div/>"), sequenceElement));
        //find first category container containing structure info and sets it as active structure.
        this.categoryContainers.forEach((categoryContainer) => {
            const trackContainer = categoryContainer.getFirstTrackContainerWithStructureInfo();
            if (trackContainer && !this.activeStructure) {
                const structureInfo = trackContainer.getStructureInfo()!;
                this.activeStructure = { trackContainer, structureInfo: structureInfo };
                this.activeStructure?.trackContainer.activate();
                const chainMapping = structureInfo.mapping[structureInfo.chain];
                this.setChainHighlights(chainMapping);
            }
            this.protvistaManager.append(categoryContainer.content);
        });

        $(element).append(this.protvistaManager);
        this.categoryContainers.forEach((categoryContainer) => {
            categoryContainer.trackContainers.forEach((trackContainer) => {
                //changes active structure to the last activated one using label click
                trackContainer.onLabelClick.on((structureInfo) => {
                    if (
                        this.activeStructure?.trackContainer == trackContainer &&
                        this.activeStructure.structureInfo == structureInfo
                    ) {
                        return;
                    }
                    this.activeStructure?.trackContainer.deactivate();
                    this.activeStructure = {
                        trackContainer,
                        structureInfo: structureInfo
                    };
                    this.activeStructure.trackContainer.activate();
                    const chainMapping = structureInfo.mapping[structureInfo.chain];
                    this.setChainHighlights(chainMapping);
                    this.emitOnSelectedStructure.emit(structureInfo);
                });
                trackContainer.track.addEventListener("click", (e) => {
                    if (!(e.target as Element).closest(".feature")) {
                        this.highlightOff();
                    }
                });

                //changes active structure to the last activated one using click on fragment
                //changes active tooltip
                trackContainer.track.addEventListener("change", (e) => {
                    const event = e as CustomEvent;
                    const detail: EventDetail = event.detail;
                    this.updateTooltip(detail, resizeObserver);
                    if (detail?.eventtype == "click") {
                        const structureInfo = detail.target?.__data__?.structureInfo;
                        if (structureInfo) {
                            if (
                                this.activeStructure?.trackContainer == trackContainer &&
                                this.activeStructure.structureInfo == structureInfo
                            ) {
                                return;
                            }
                            this.activeStructure?.trackContainer.deactivate();
                            this.activeStructure = {
                                trackContainer,
                                structureInfo: structureInfo
                            };
                            this.activeStructure.trackContainer.activate();
                            const chainMapping = structureInfo.mapping[structureInfo.chain];
                            this.setChainHighlights(chainMapping);
                            this.emitOnSelectedStructure.emit(structureInfo);
                        }
                    }
                });
            });
            //listens for any highlight change and if detected it gathers
            //all highlights and applies them to protvista-manager
            //it also gathers marked annotations and those are emitted
            //as event
            categoryContainer.onHighlightChange.on(() => {
                const highligtedFragments = this.categoryContainers.flatMap((categoryContainer) =>
                    categoryContainer.getHighlightedTrackFragments()
                );
                this.clickedHighlights = highligtedFragments
                    .map((fragment) => {
                        return `${fragment.sequenceStart}:${fragment.sequenceEnd}:${
                            fragment.color.length >= 7
                                ? fragment.color.slice(0, 7).concat("66")
                                : fragment.color
                        }`;
                    })
                    .join(",");
                this.applyHighlights();
                this.emitOnMarkChange.emit(
                    this.categoryContainers.flatMap((categoryContainer) =>
                        categoryContainer.getMarkedTrackFragments()
                    )
                );
            });
            //at this point the protvista components from categoryContainer are
            //inserted into DOM tree so we can safely call addData method
            categoryContainer.addData();
        });
        //moves with tooltip when main element changes size
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
                    this.protvistaManager
                        .find("protvista-tooltip")
                        .attr("x", boundingRect.x + mouseX)
                        .attr("y", boundingRect.y + mouseY)
                        .attr("visible", "");
                }
            }
        });
        resizeObserver.observe(element);

        //creates overlay scrollbars for every category
        OverlayScrollbars(document.querySelectorAll(".un-subtracks-container.scrollable"), {
            resize: "vertical",
            paddingAbsolute: true,
            scrollbars: {
                clickScrolling: true,
                autoHide: "leave"
            }
        });
        const protvistaNavigation = this.protvistaManager.find(
            "protvista-navigation"
        )[0] as ProtvistaNavigation;
        let lastFocusedResidue: number | undefined;

        //show yellow residue highlight when hovering over variants
        this.protvistaManager
            .find("protvista-variation")
            .on("change", (e) => {
                const detail = e.detail as any;
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
        //show yellow residue highlight when hovering over fragments
        this.protvistaManager
            .find("protvista-track g.fragment-group")
            .on("mousemove", (e) => {
                const element = e.target as HTMLElementWithData;
                const feature = element.__data__;
                const xScale = d3
                    .scaleLinear<number>()
                    .domain([0, protvistaNavigation.width - 2 * protvistaNavigation._padding])
                    .rangeRound([
                        parseInt(protvistaNavigation._displaystart),
                        parseInt(protvistaNavigation._displayend) + 1
                    ]);
                const residueNumber = Math.max(
                    Math.min(xScale(e.offsetX - protvistaNavigation._padding), feature.end),
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

    public getActiveStructureInfo(): StructureInfo | undefined {
        return this.activeStructure?.structureInfo;
    }

    public setHighlights(highlights: Highlight[]): void {
        this.publicHighlights = highlights
            .map((highlight) => {
                return `${highlight.sequenceStart}:${highlight.sequenceEnd}${
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
                    sequenceStart: Math.min(
                        ...chainMapping.fragmentMappings.map((mapping) => mapping.sequenceStart)
                    ),
                    sequenceEnd: Math.max(
                        ...chainMapping.fragmentMappings.map((mapping) => mapping.sequenceEnd)
                    ),
                    color: "#0000001A"
                }
            ]);
        }
    }

    private highlightOff(): void {
        this.clickedHighlights = "";
        this.categoryContainers.forEach((trackContainer) =>
            trackContainer.clearHighlightedTrackFragments()
        );
        this.applyHighlights();
    }

    private setFixedHighlights(highlights: Highlight[]): void {
        this.fixedHighlights = highlights
            .map((highlight) => {
                return `${highlight.sequenceStart}:${highlight.sequenceEnd}${
                    highlight.color ? ":" + highlight.color : ""
                }`;
            })
            .join(",");
        this.applyHighlights();
    }

    private applyHighlights(): void {
        this.protvistaManager.attr(
            "highlight",
            `${this.fixedHighlights ?? ""}${
                this.clickedHighlights ? "," + this.clickedHighlights : ""
            }${this.publicHighlights ? "," + this.publicHighlights : ""}${
                this.mouseoverHighlights ? "," + this.mouseoverHighlights : ""
            }`
        );
        this.protvistaManager[0].applyAttributes();
    }

    private updateTooltip(detail: EventDetail, resizeObserver: ResizeObserver): void {
        const previousTooltip = this.protvistaManager.find("protvista-tooltip");
        if (detail.eventtype == "mouseout") {
            if (previousTooltip.length == 0 || !previousTooltip.hasClass("click-open")) {
                this.removeAllTooltips();
            }
            return;
        }
        if (detail.eventtype == "click") {
            this.createTooltip(detail, resizeObserver, true);
            return;
        }
        if (detail.eventtype == "mouseover") {
            if (previousTooltip.length == 0 || !previousTooltip.hasClass("click-open")) {
                this.removeAllTooltips();
                this.createTooltip(detail, resizeObserver);
            }
            return;
        }
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
            this.findOrCreateTooltip()
                .attr("x", detail.coords[0])
                .attr("y", detail.coords[1])
                .attr("title", fragment.tooltipContent?.title ?? "")
                .attr("visible", "true")
                .html(fragment.tooltipContent?.content ?? "");

            if (closeable) {
                const fragment: HTMLElementWithData = detail.target;
                const boundingRect: DOMRect = fragment.getBoundingClientRect();
                const mouseX: number = (detail.coords[0] - boundingRect.x) / boundingRect.width;
                const mouseY: number = (detail.coords[1] - boundingRect.y) / boundingRect.height;
                this.lastClickedFragment = {
                    fragment: fragment,
                    mouseX: mouseX,
                    mouseY: mouseY
                };
                resizeObserver.observe(this.lastClickedFragment.fragment);
                this.protvistaManager.find("protvista-tooltip").addClass("click-open");
            }
        }
    }
    private findOrCreateTooltip(): JQuery<HTMLElement> {
        const lastTooltip = this.protvistaManager.find("protvista-tooltip");
        if (lastTooltip.length == 0) {
            const newTooltip = $("<protvista-tooltip/>");
            this.protvistaManager.append(newTooltip);
            return newTooltip;
        }
        return lastTooltip;
    }

    private removeAllTooltips(): void {
        this.protvistaManager.find("protvista-tooltip").remove();
    }
}
type ActiveStructure = {
    readonly trackContainer: TrackContainer;
    readonly structureInfo: StructureInfo;
};

type EventDetail = {
    readonly eventtype: string;
    readonly coords: number[];
    readonly target: HTMLElementWithData | undefined;
};
