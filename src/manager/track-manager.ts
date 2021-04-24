import d3 = require('d3');
import CategoryContainer from './category-container';
import TrackParser from '../parsers/track-parser';
import { createRow, fetchWithTimeout } from '../utils';
import { Accession, ElementWithData } from '../renderers/basic-track-renderer';
import PdbParser from '../parsers/pdb-parser';
import AntigenParser from '../parsers/antigen-parser';
import FeatureParser from '../parsers/feature-parser';
import ProteomicsParser from '../parsers/proteomics-parser';
import SMRParser from '../parsers/SMR-parser';
import VariationParser from '../parsers/variation-parser';
import ProtvistaManager from 'protvista-manager';
import { createEmitter } from "ts-typed-events";
import ProtvistaNavigation from 'protvista-navigation';

type Constructor<T> = new (...args: any[]) => T;
export default class TrackManager {
    private readonly emitOnResidueMouseOver = createEmitter<number>();
    public readonly onResidueMouseOver = this.emitOnResidueMouseOver.event;
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

    public getParsersByType<T extends TrackParser<any>>(filterType: Constructor<T>): T[] {
        return this.tracks.map(t => t.parser)
            .filter(parser => parser instanceof filterType)
            .map(parser => parser as T);
    }

    public async render(uniprotId: string, element: HTMLElement) {
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
                            track.parser.failDataLoaded();
                            return Promise.reject();
                        }
                    )
            )
        ).then(renderers => {
            const categoryContainers: CategoryContainer[] = [];
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
                    categoryContainers.push(categoryContainer);
                    this.protvistaManager.appendChild(categoryContainer.content);
                });

            element.appendChild(this.protvistaManager);
            categoryContainers.forEach(categoryContainer => {
                categoryContainer.onHighlightChange.on(trackFragments => {
                    this.emitOnHighlightChange.emit(categoryContainers.flatMap(categoryContainer => categoryContainer.getMarkedTrackFragments()));
                });
                categoryContainer.addData();
            });
            const resizeObserver = new ResizeObserver(() => {
                if (this.lastClickedFragment) {
                    const boundingRect = this.lastClickedFragment.fragment.getBoundingClientRect();
                    const mouseX = boundingRect.width * this.lastClickedFragment.mouseX;
                    const mouseY = boundingRect.height * this.lastClickedFragment.mouseY;
                    this.protvistaManagerD3.select("protvista-tooltip")
                        .attr("x", boundingRect.x + mouseX)
                        .attr("y", boundingRect.y + mouseY)
                }
            });
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
        });

    }
    public highlight(start: number, end: number) {
        this.protvistaManager.dispatchEvent(new CustomEvent('change', {
            detail: {
                highlight: `${start}:${end}`,
            }, bubbles: true, cancelable: true
        }));
    }

    public highlightOff() {
        this.protvistaManager.dispatchEvent(new CustomEvent('change', {
            detail: {
                highlight: null,
            }, bubbles: true, cancelable: true
        }));
    }

    public addTrack(urlGenerator: (url: string) => string, parser: TrackParser<any>) {
        this.tracks.push({ urlGenerator, parser })
    }
    private updateTooltip(
        detail: { eventtype: string, coords: number[]; feature: Accession; target: ElementWithData | undefined; },
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
    readonly parser: TrackParser<any>;
}

export type TrackFragment = {
    readonly start: number;
    readonly end: number;
    readonly color: string;
}