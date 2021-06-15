import * as d3 from "d3";
import CategoryContainer from "./category-container";
import TrackParser from "../parsers/track-parser";
import { createRow, fetchWithTimeout } from "../utils";
import PdbParser, { PDBParserItem } from "../parsers/pdb-parser";
import FeatureParser from "../parsers/feature-parser";
import SMRParser from "../parsers/SMR-parser";
import VariationParser from "../parsers/variation-parser";
import ProtvistaManager from "protvista-manager";
import { createEmitter } from "ts-typed-events";
import ProtvistaNavigation from "protvista-navigation";
import OverlayScrollbars from "overlayscrollbars";
import "overlayscrollbars/css/OverlayScrollbars.min.css";
import TrackContainer from "./track-container";
import TrackRenderer from "../renderers/track-renderer";
import { Feature } from "protvista-feature-adapter/src/BasicHelper";
import { Fragment, Output, TrackFragment } from "../types/accession";
import { ElementWithData } from "./fragment-wrapper";
import { ProteinsAPIVariation } from "../types/variants";
export default class TrackManager {
    private readonly emitOnResidueMouseOver = createEmitter<number>();
    public readonly onResidueMouseOver = this.emitOnResidueMouseOver.event;
    private readonly emitOnSelectedStructure = createEmitter<Output>();
    public readonly onSelectedStructure = this.emitOnSelectedStructure.event;
    private readonly emitOnFragmentMouseOut = createEmitter<void>();
    public readonly onFragmentMouseOut = this.emitOnFragmentMouseOut.event;
    private readonly emitOnRendered = createEmitter<void>();
    public readonly onRendered = this.emitOnRendered.event;
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private readonly tracks: Track[] = [];
    private sequence = "";
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
    private readonly uniprotId: string;

    constructor(
        private readonly sequenceUrlGenerator: (
            url: string
        ) => Promise<{ sequence: string; startRow: number }>,
        private readonly config?: Config
    ) {
        if (config?.uniprotId) {
            if (config?.sequence) {
                throw new Error("UniProt ID and sequence are mutually exclusive!");
            }
            this.uniprotId = config.uniprotId;
        } else if (!config?.sequence) {
            throw new Error("UniProt ID or sequence is missing!");
        }
        if (config?.sequence && !config.sequenceStructureMapping) {
            throw new Error("Sequence-structure mapping is missing!");
        }
    }

    public static createDefault(config: Config): TrackManager {
        const trackManager = new TrackManager(
            (uniProtId) =>
                config?.sequence
                    ? Promise.resolve({
                          sequence: config?.sequence,
                          startRow: 0
                      })
                    : fetchWithTimeout(`https://www.uniprot.org/uniprot/${uniProtId}.fasta`, {
                          timeout: 8000
                      })
                          .then((data) => data.text())
                          .then((sequence) => {
                              return {
                                  sequence: sequence,
                                  startRow: 1
                              };
                          }),
            config
        );
        if (config?.sequenceStructureMapping) {
            trackManager.addTrack((uniProtId) => {
                const record: Record<string, PDBParserItem> = {};
                record[uniProtId] = config.sequenceStructureMapping!;
                return Promise.resolve(record);
            }, new PdbParser(config?.pdbIds, "User provided structures", "USER_PROVIDED_STRUCTURES"));
        }

        trackManager.addFetchTrack(
            (uniProtId) => `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniProtId}`,
            new PdbParser(config?.pdbIds)
        );
        trackManager.addFetchTrack(
            (uniProtId) =>
                `https://swissmodel.expasy.org/repository/uniprot/${uniProtId}.json?provider=swissmodel`,
            new SMRParser(config?.smrIds)
        );
        trackManager.addFetchTrack(
            (uniProtId) => `https://www.ebi.ac.uk/proteins/api/features/${uniProtId}`,
            new FeatureParser(config?.exclusions)
        );
        trackManager.addFetchTrack(
            (uniProtId) => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniProtId}`,
            new FeatureParser(config?.exclusions)
        );
        trackManager.addFetchTrack(
            (uniProtId) => `https://www.ebi.ac.uk/proteins/api/antigen/${uniProtId}`,
            new FeatureParser(config?.exclusions)
        );
        trackManager.addFetchTrack(
            (uniProtId) => `https://www.ebi.ac.uk/proteins/api/variation/${uniProtId}`,
            new VariationParser(config?.overwritePredictions),
            (data: ProteinsAPIVariation) => data?.features ?? data
        );
        config?.customDataSources?.forEach((customDataSource) => {
            if (customDataSource.url) {
                trackManager.addFetchTrack(
                    (uniProtId) =>
                        `${customDataSource.url}${uniProtId}${
                            customDataSource.useExtension ? ".json" : ""
                        }`,
                    new FeatureParser(config?.exclusions, customDataSource.source)
                );
            }
            if (customDataSource.data) {
                const variationFeatures: CustomDataSourceFeature[] = [];
                const otherFeatures: CustomDataSourceFeature[] = [];
                customDataSource.data.features.forEach((feature) => {
                    if (feature.category == "VARIATION") {
                        variationFeatures.push(feature);
                    } else {
                        otherFeatures.push(feature);
                    }
                });
                trackManager.addTrack(
                    () =>
                        Promise.resolve({
                            sequence: customDataSource.data.sequence,
                            features: variationFeatures
                        }),
                    new VariationParser(config?.overwritePredictions, customDataSource.source)
                );
                trackManager.addTrack(
                    () =>
                        Promise.resolve({
                            sequence: customDataSource.data.sequence,
                            features: otherFeatures
                        }),
                    new FeatureParser(config?.exclusions, customDataSource.source)
                );
            }
        });
        return trackManager;
    }

    public async render(element: HTMLElement): Promise<void> {
        this.activeStructure = undefined;
        await this.sequenceUrlGenerator(this.uniprotId).then((data) => {
            const tokens: string[] = data.sequence.split(/\r?\n/);
            for (let i = data.startRow; i < tokens.length; i++) {
                this.sequence += tokens[i];
            }
            const navigationElement = d3
                .create("protvista-navigation")
                .attr("length", this.sequence.length);
            this.protvistaManager.appendChild(
                createRow(d3.create("div").node()!, navigationElement.node()!).node()!
            );
            const sequenceElement = d3
                .create("protvista-sequence")
                .attr("length", this.sequence.length)
                .attr("sequence", this.sequence)
                .attr("numberofticks", 10);
            this.protvistaManager.appendChild(
                createRow(d3.create("div").node()!, sequenceElement.node()!).node()!
            );
        });

        Promise.allSettled(
            this.tracks.map((track) =>
                track.dataFetcher(this.uniprotId).then(
                    (data) => {
                        return track.parser.parse(this.uniprotId, data);
                    },
                    (err) => {
                        console.log(`DATA unavailable!`, err);
                        return Promise.reject();
                    }
                )
            )
        )
            .then((renderers) => {
                const filteredRenderes: TrackRenderer[] = renderers
                    .map((promiseSettled) => {
                        if (promiseSettled.status == "fulfilled") {
                            return promiseSettled.value;
                        }
                        console.warn(promiseSettled.reason);
                        return null;
                    })
                    .flatMap((renderer) => renderer)
                    .filter((renderer) => renderer != null)
                    .map((renderer) => renderer!);
                this.sortRenderers(filteredRenderes, this.config?.categoryOrder).forEach(
                    (renderer) => {
                        const categoryContainer = renderer.getCategoryContainer(this.sequence);
                        const trackContainer = categoryContainer.getFirstTrackContainerWithOutput();
                        if (trackContainer && !this.activeStructure) {
                            const output = trackContainer.getOutput()!;
                            this.activeStructure = { trackContainer, output };
                            this.activeStructure?.trackContainer.activate();
                            this.setFixedHighlights([
                                {
                                    start: output.mapping.uniprotStart,
                                    end: output.mapping.uniprotEnd,
                                    color: "#0000001A"
                                }
                            ]);
                            this.emitOnSelectedStructure(output);
                        }
                        this.categoryContainers.push(categoryContainer);
                        this.protvistaManager.appendChild(categoryContainer.content);
                    }
                );

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
                            this.setFixedHighlights([
                                {
                                    start: output.mapping.uniprotStart,
                                    end: output.mapping.uniprotEnd,
                                    color: "#0000001A"
                                }
                            ]);
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
                                    this.setFixedHighlights([
                                        {
                                            start: output.mapping.uniprotStart,
                                            end: output.mapping.uniprotEnd,
                                            color: "#0000001A"
                                        }
                                    ]);
                                    this.emitOnSelectedStructure(output);
                                }
                            }
                        });
                    });
                    categoryContainer.onHighlightChange.on(() => {
                        const highligtedFragments = this.categoryContainers.flatMap(
                            (categoryContainer) => categoryContainer.getHighlightedTrackFragments()
                        );
                        this.clickedHighlights = highligtedFragments
                            .map((fragment) => {
                                return `${fragment.start}:${fragment.end}:${fragment.color}`;
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
                        const boundingRect =
                            this.lastClickedFragment.fragment.getBoundingClientRect();
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
                            .domain([
                                0,
                                protvistaNavigation.width - 2 * protvistaNavigation._padding
                            ])
                            .rangeRound([
                                parseInt(protvistaNavigation._displaystart),
                                parseInt(protvistaNavigation._displayend) + 1
                            ]);

                        // console.log(e.offsetX - protvistaNavigation._padding);
                        // console.log(e.offsetX);
                        const residueNumber = Math.max(
                            Math.min(
                                xScale(d3.event.offsetX - protvistaNavigation._padding),
                                feature.end
                            ),
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
                this.emitOnRendered.emit();
            })
            .catch((e) => {
                console.log(e);
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

    public addTrack<T>(dataFetcher: (uniprotId: string) => Promise<T>, parser: TrackParser): void {
        if (!this.config?.exclusions?.includes(parser.categoryName)) {
            this.tracks.push({ dataFetcher: dataFetcher, parser });
        }
    }

    public getMarkedFragments(): TrackFragment[] {
        return this.categoryContainers.flatMap((categoryContainer) =>
            categoryContainer.getMarkedTrackFragments()
        );
    }

    public addFetchTrack(
        urlGenerator: (uniprotId: string) => string,
        parser: TrackParser,
        mapper?: (data: any) => any
    ): void {
        this.addTrack(
            (uniprodId) =>
                fetchWithTimeout(urlGenerator(uniprodId), {
                    timeout: 8000
                }).then(
                    (data) => {
                        const json = data.json();
                        return mapper ? mapper(json) : json;
                    },
                    (err) => {
                        console.log(`API unavailable!`, err);
                        return Promise.reject();
                    }
                ),
            parser
        );
    }

    private highlightOff(): void {
        this.publicHighlights = "";
        this.clickedHighlights = "";
        this.categoryContainers.forEach((trackContainer) =>
            trackContainer.clearHighlightedTrackFragments()
        );
        this.applyHighlights();
    }

    private sortRenderers(
        filteredRenderes: TrackRenderer[],
        categoryOrder?: string[]
    ): TrackRenderer[] {
        const map = new Map<string, TrackRenderer>();
        filteredRenderes.forEach((renderer) => {
            const previousRenderer = map.get(renderer.categoryName);
            if (previousRenderer) {
                map.set(renderer.categoryName, previousRenderer.combine(renderer));
            } else {
                map.set(renderer.categoryName, renderer);
            }
        });
        const sortedRenderers: TrackRenderer[] = [];
        categoryOrder?.forEach((categoryName) => {
            const renderer = map.get(categoryName);
            if (renderer) {
                sortedRenderers.push(renderer);
                map.delete(categoryName);
            }
        });
        map.forEach((renderer) => {
            sortedRenderers.push(renderer);
        });
        return sortedRenderers;
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

type Track = {
    readonly dataFetcher: (uniprotId: string) => Promise<any>;
    readonly parser: TrackParser;
};

type CustomDataSource = {
    readonly source: string;
    readonly useExtension?: boolean;
    readonly url?: string;
    readonly data: CustomDataSourceData;
};

type CustomDataSourceData = {
    readonly sequence: string;
    readonly features: CustomDataSourceFeature[];
};

type CustomDataSourceFeature = Feature & {
    readonly type: string;
    readonly category: string;
    readonly color?: string;
};

type ActiveStructure = {
    readonly trackContainer: TrackContainer;
    readonly output: Output;
};

type EventDetail = {
    readonly eventtype: string;
    readonly coords: number[];
    readonly target: ElementWithData | undefined;
};

export type Highlight = {
    readonly start: number;
    readonly end: number;
    readonly color?: string;
};

export type Config = {
    readonly uniprotId: string;
    readonly pdbIds?: string[];
    readonly smrIds?: string[];
    readonly categoryOrder?: string[];
    readonly exclusions?: string[];
    readonly customDataSources?: CustomDataSource[];
    readonly overwritePredictions?: boolean;
    readonly sequence?: string;
    readonly sequenceStructureMapping?: PDBParserItem;
};
