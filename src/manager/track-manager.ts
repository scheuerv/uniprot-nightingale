import d3 = require('d3');
import CategoryContainer from './category-container';
import TrackParser, { Mapping } from '../parsers/track-parser';
import { createRow, fetchWithTimeout } from '../utils';
import { ElementWithData } from '../renderers/basic-track-renderer';
import PdbParser from '../parsers/pdb-parser';
import AntigenParser from '../parsers/antigen-parser';
import FeatureParser from '../parsers/feature-parser';
import ProteomicsParser from '../parsers/proteomics-parser';
import SMRParser from '../parsers/SMR-parser';
import VariationParser from '../parsers/variation-parser';
import ProtvistaManager from 'protvista-manager';
import { createEmitter } from "ts-typed-events";
import ProtvistaNavigation from 'protvista-navigation';
import OverlayScrollbars from 'overlayscrollbars';
import StructureTrackParser from '../parsers/structure-track-parser';
import 'overlayscrollbars/css/OverlayScrollbars.min.css'

type Constructor<T> = new (...args: any[]) => T;
export default class TrackManager {
    private readonly emitOnResidueMouseOver = createEmitter<number>();
    public readonly onResidueMouseOver = this.emitOnResidueMouseOver.event;
    private readonly emitOnSelectedStructure = createEmitter<Output>();
    public readonly onSelectedStructure = this.emitOnSelectedStructure.event;
    private readonly emitOnFragmentMouseOut = createEmitter();
    public readonly onFragmentMouseOut = this.emitOnFragmentMouseOut.event;
    private readonly emitOnRendered = createEmitter();
    public readonly onRendered = this.emitOnRendered.event;
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    private readonly tracks: Track[] = [];
    private sequence: string = "";
    private lastClickedFragment: {
        fragment: ElementWithData,
        mouseX: number,
        mouseY: number
    } | undefined;
    private readonly protvistaManagerD3 = d3.create("protvista-manager").attr("attributes", "length displaystart displayend highlightstart highlightend activefilters filters");
    private readonly protvistaManager = this.protvistaManagerD3.node()! as ProtvistaManager;
    private fixedHighlights: string = "";
    private clickedHighlights: string = "";
    private publicHighlights: string = "";
    private readonly categoryContainers: CategoryContainer[] = [];
    private activeStructure?: Output = undefined;
    constructor(private readonly sequenceUrlGenerator: (url: string) => string) {

    }
    public static createDefault() {
        const trackManager = new TrackManager(uniProtId => `https://www.uniprot.org/uniprot/${uniProtId}.fasta`)
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniProtId}`, new PdbParser());
        trackManager.addTrack(uniProtId => `https://swissmodel.expasy.org/repository/uniprot/${uniProtId}.json?provider=swissmodel`, new SMRParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/features/${uniProtId}`, new FeatureParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniProtId}`, new ProteomicsParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/antigen/${uniProtId}`, new AntigenParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/variation/${uniProtId}`, new VariationParser());
        return trackManager;
    }

    public getParsersByType<T extends TrackParser>(filterType: Constructor<T>): T[] {
        return this.tracks.map(t => t.parser)
            .filter(parser => parser instanceof filterType)
            .map(parser => parser as T);
    }

    public async render(uniprotId: string, element: HTMLElement) {
        this.activeStructure = undefined;
        Promise.all(
            this.tracks
                .filter(track => this.isStructureTrackParser(track.parser))
                .map(track => track.parser as StructureTrackParser)
                .map(parser => {
                    return new Promise<Output | null>(resolve => {
                        parser.onStructureLoaded.on(outputs => {
                            if (!this.activeStructure && outputs.length > 0) {
                                return resolve(outputs[0]);
                            } else {
                                return resolve(null);
                            }
                        });
                    });
                })
        ).then(outputs => {
            for (let i = 0; i < outputs.length; i++) {
                const output = outputs[i];
                if (output != null) {
                    this.activeStructure = output;
                    this.setFixedHighlights([{ start: output.mapping.uniprotStart, end: output.mapping.uniprotEnd, color: '#0000001A' }]);
                    this.emitOnSelectedStructure(output);
                    break;
                }
            }

        });

        await fetchWithTimeout(this.sequenceUrlGenerator(uniprotId), { timeout: 8000 }).then(data => data.text())
            .then(data => {
                const tokens = data.split(/\r?\n/);
                for (let i = 1; i < tokens.length; i++) {
                    this.sequence += tokens[i];
                }
                const navigationElement = d3.create('protvista-navigation').attr("length", this.sequence.length);
                this.protvistaManager.appendChild(
                    createRow(
                        d3.create('div').node()!, navigationElement.node()!
                    ).node()!
                );
                const sequenceElement = d3.create('protvista-sequence').attr("length", this.sequence.length).attr("sequence", this.sequence);
                this.protvistaManager.appendChild(
                    createRow(
                        d3.create('div').node()!, sequenceElement.node()!
                    ).node()!
                );
            });

        Promise.allSettled(
            this.tracks.map(
                track => fetchWithTimeout(track.urlGenerator(uniprotId), { timeout: 8000 })
                    .then(
                        data => data.json().then(data => {
                            return track.parser.parse(uniprotId, data);
                        }), err => {
                            console.log(`API unavailable!`, err);
                            if (this.isStructureTrackParser(track.parser)) {
                                track.parser.failDataLoaded();
                            }
                            return Promise.reject();
                        }
                    )
            )
        ).then(renderers => {
            renderers
                .map(promiseSettled => {
                    if (promiseSettled.status == "fulfilled") {
                        return promiseSettled.value;
                    }
                    return null;
                })
                .filter(renderer => renderer != null)
                .map(renderer => renderer!)
                .forEach(renderer => {
                    const categoryContainer = renderer.getCategoryContainer(this.sequence);
                    this.categoryContainers.push(categoryContainer);
                    this.protvistaManager.appendChild(categoryContainer.content);
                });

            element.appendChild(this.protvistaManager);
            this.categoryContainers.forEach(categoryContainer => {
                categoryContainer.trackContainers.forEach(trackContainer => {
                    trackContainer.track.addEventListener("click", (e) => {
                        if (!(e.target as Element).closest(".feature")) {
                            this.removeAllTooltips();
                            this.highlightOff();
                        }
                    });
                });
                categoryContainer.onHighlightChange.on(trackFragments => {
                    const highligtedFragments = this.categoryContainers.flatMap(categoryContainer => categoryContainer.getHighlightedTrackFragments());
                    this.clickedHighlights = highligtedFragments.map(fragment => {
                        return `${fragment.start}:${fragment.end}:${fragment.color}`;
                    }).join(',');
                    this.applyHighlights();
                    this.emitOnHighlightChange.emit(this.categoryContainers.flatMap(categoryContainer => categoryContainer.getMarkedTrackFragments()));
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
                    }
                    else {
                        const mouseX = boundingRect.width * this.lastClickedFragment.mouseX;
                        const mouseY = boundingRect.height * this.lastClickedFragment.mouseY;
                        this.protvistaManagerD3.select("protvista-tooltip")
                            .attr("x", boundingRect.x + mouseX)
                            .attr("y", boundingRect.y + mouseY)
                            .attr('visible', '');
                    }
                }
            });
            OverlayScrollbars(document.querySelectorAll('.subtracks-container.scrollable'), {
                resize: "vertical",
                paddingAbsolute: true,
                scrollbars: {
                    clickScrolling: true,
                    autoHide: 'leave'
                }
            });
            resizeObserver.observe(element);
            this.protvistaManagerD3.selectAll("protvista-track").on("change", () => {
                this.updateTooltip(d3.event.detail, resizeObserver);
            });
            const protvistaNavigation = this.protvistaManagerD3.select("protvista-navigation").node() as ProtvistaNavigation;
            let lastFocusedResidue: number | undefined;
            this.protvistaManagerD3.selectAll("protvista-track g.fragment-group").on("mousemove", f => {
                const feature = f as { start: number, end: number };
                const xScale = d3.scaleLinear<number>()
                    .domain([0, protvistaNavigation.width - 2 * protvistaNavigation._padding])
                    .rangeRound([
                        parseInt(protvistaNavigation._displaystart),
                        parseInt(protvistaNavigation._displayend) + 1
                    ]);

                // console.log(e.offsetX - protvistaNavigation._padding);
                // console.log(e.offsetX);
                const residueNumber = Math.max(Math.min(xScale(d3.event.offsetX - protvistaNavigation._padding), feature.end), feature.start);
                if (lastFocusedResidue != residueNumber) {
                    lastFocusedResidue = residueNumber;
                    this.emitOnResidueMouseOver.emit(residueNumber);
                }
            }).on("mouseout", () => {
                lastFocusedResidue = undefined;
                this.emitOnFragmentMouseOut.emit();
            });
            this.emitOnRendered.emit();
        }).catch(e => {
            console.log(e);
        });

    }
    public setHighlights(highlights: Highlight[]) {
        this.publicHighlights = highlights.map(highlight => {
            return `${highlight.start}:${highlight.end}${highlight.color ? ':' + highlight.color : ''}`;
        }).join(',');
        this.applyHighlights()
    }
    public clearHighlights() {
        this.publicHighlights = '';
        this.applyHighlights();
    }

    public highlightOff() {
        this.publicHighlights = "";
        this.clickedHighlights = "";
        this.categoryContainers.forEach(trackContainer => trackContainer.clearHighlightedTrackFragments());
        this.applyHighlights();
    }

    public addTrack(urlGenerator: (url: string) => string, parser: TrackParser) {
        this.tracks.push({ urlGenerator, parser });

        if (this.isStructureTrackParser(parser)) {
            parser.onLabelClick.on(output => {
                this.activeStructure = output;
                this.setFixedHighlights([{ start: output.mapping.uniprotStart, end: output.mapping.uniprotEnd, color: '#0000001A' }]);
                this.emitOnSelectedStructure(output);
            });
        }
    }

    private setFixedHighlights(highlights: Highlight[]) {
        this.fixedHighlights = highlights.map(highlight => {
            return `${highlight.start}:${highlight.end}${highlight.color ? ':' + highlight.color : ''}`;
        }).join(',');
        this.applyHighlights();
    }

    private applyHighlights() {
        this.protvistaManager.highlight = `${this.fixedHighlights ?? ''}${this.clickedHighlights ? ',' + this.clickedHighlights : ''}${this.publicHighlights ? ',' + this.publicHighlights : ''}`;
        this.protvistaManager.applyAttributes();
    }
    private isStructureTrackParser(object: unknown): object is StructureTrackParser {
        return Object.prototype.hasOwnProperty.call(object, "onStructureLoaded")
            && Object.prototype.hasOwnProperty.call(object, "onLabelClick");
    }
    private updateTooltip(
        detail: { eventtype: string, coords: number[]; target: ElementWithData | undefined; },
        resizeObserver: ResizeObserver
    ) {
        const previousTooltip = this.protvistaManagerD3.select("protvista-tooltip");
        if (detail.eventtype == 'mouseout') {
            if (!previousTooltip.empty() && previousTooltip.classed('click-open')) {
            } else {
                this.removeAllTooltips();
            }
            return;
        }
        if (detail.eventtype == 'click') {
            this.createTooltip(detail, resizeObserver, true);
            return;
        }
        if (detail.eventtype == 'mouseover') {
            if (!previousTooltip.empty() && previousTooltip.classed('click-open')) {
            } else {
                this.removeAllTooltips();
                this.createTooltip(detail, resizeObserver);
            }
            return;
        }
        this.removeAllTooltips();
    }
    private createTooltip(detail: { coords: number[]; target: ElementWithData | undefined; }, resizeObserver: ResizeObserver, closeable = false) {
        if (this.lastClickedFragment) {
            resizeObserver.unobserve(this.lastClickedFragment.fragment)
            this.lastClickedFragment = undefined;
        }
        if (detail.target) {
            const fragment = detail.target.__data__;
            this.protvistaManagerD3.selectAll("protvista-tooltip")
                .data([fragment])
                .enter()
                .append("protvista-tooltip");
            this.protvistaManagerD3.selectAll("protvista-tooltip")
                .attr("x", detail.coords[0])
                .attr("y", detail.coords[1])
                .attr("title", fragment.tooltipContent?.title ?? "")
                .attr("visible", true)
                .html(fragment.tooltipContent?.render() ?? "");
            if (closeable) {
                const fragment = detail.target;
                const boundingRect = fragment.getBoundingClientRect();
                const mouseX = (detail.coords[0] - boundingRect.x) / boundingRect.width;
                const mouseY = (detail.coords[1] - boundingRect.y) / boundingRect.height;
                this.lastClickedFragment = { fragment: fragment, mouseX: mouseX, mouseY: mouseY };
                resizeObserver.observe(this.lastClickedFragment.fragment)
                this.protvistaManagerD3.select("protvista-tooltip").classed('click-open', true);
            }
        }
    }
    private removeAllTooltips() {
        this.protvistaManagerD3.selectAll("protvista-tooltip").remove();
    }
}

type Track = {
    readonly urlGenerator: (url: string) => string;
    readonly parser: TrackParser;
}
export type Highlight = {
    readonly start: number;
    readonly end: number;
    readonly color?: string;
}
export type TrackFragment = {
    readonly start: number;
    readonly end: number;
    readonly color: string;
}
export type Output = {
    readonly pdbId: string, readonly chain: string, readonly mapping: Mapping, readonly url: string, readonly format: "mmcif" | "cifCore" | "pdb" | "pdbqt" | "gro" | "xyz" | "mol" | "sdf" | "mol2"
}