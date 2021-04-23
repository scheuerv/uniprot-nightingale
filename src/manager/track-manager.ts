import d3 = require('d3');
import CategoryContainer from './category-container';
import TrackParser from '../parsers/track-parser';
import { createRow, fetchWithTimeout } from '../utils';
import { Accession, ElementWithData, Fragment } from '../renderers/basic-track-renderer';
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
    private protvistaManager: ProtvistaManager;
    constructor(private readonly sequenceUrlGenerator: (url: string) => string) {

    }
    static createDefault() {
        const trackManager = new TrackManager(uniProtId => `https://www.uniprot.org/uniprot/${uniProtId}.fasta`)
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/pdbe/api/mappings/best_structures/${uniProtId}`, new PdbParser());
        trackManager.addTrack(uniProtId => `https://swissmodel.expasy.org/repository/uniprot/${uniProtId}.json?provider=swissmodel`, new SMRParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/features/${uniProtId}`, new FeatureParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/proteomics/${uniProtId}`, new ProteomicsParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/antigen/${uniProtId}`, new AntigenParser());
        trackManager.addTrack(uniProtId => `https://www.ebi.ac.uk/proteins/api/variation/${uniProtId}`, new VariationParser());
        return trackManager;
    }

    getParsersByType<T extends TrackParser<any>>(filterType: Constructor<T>): T[] {
        return this.tracks.map(t => t.parser)
            .filter(parser => parser instanceof filterType)
            .map(parser => parser as T);
    }

    async render(uniprotId: string, element: HTMLElement) {
        this.protvistaManager = d3.create("protvista-manager")
            .attr("attributes", "length displaystart displayend highlightstart highlightend activefilters filters")
            .node()! as ProtvistaManager;
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
            // window.addEventListener('resize', this.windowResize.bind(this));
            d3.selectAll("protvista-track").on("change", (f, i) => {
                const e = d3.event;
                updateTooltip(e, e.detail);
            });
            const protvistaNavigation = d3.select("protvista-navigation").node() as ProtvistaNavigation;
            let lastFocusedResidue: number | undefined;
            d3.selectAll("protvista-track g.fragment-group").on("mousemove", (f, i) => {
                const feature = f as { start: number, end: number };
                const e = d3.event;
                const xScale = d3.scaleLinear<number>()
                    .domain([0, protvistaNavigation.width - 2 * protvistaNavigation._padding])
                    .rangeRound([
                        parseInt(protvistaNavigation._displaystart),
                        parseInt(protvistaNavigation._displayend) + 1
                    ]);

                // console.log(e.offsetX - protvistaNavigation._padding);
                // console.log(e.offsetX);
                const residueNumber = Math.max(Math.min(xScale(e.offsetX - protvistaNavigation._padding), feature.end), feature.start);
                if (lastFocusedResidue != residueNumber) {
                    lastFocusedResidue = residueNumber;
                    this.emitOnResidueMouseOver.emit(residueNumber);
                }
            }).on("mouseout", (f, i) => {
                lastFocusedResidue = undefined;
                this.emitOnFragmentMouseOut.emit();
            });
            this.emitOnRendered.emit();
        });

    }
    allFragmentsInRowClicked() {
        const fragmentNodes = d3.select(d3.event.currentTarget.closest('.track-row')).selectAll('.fragment-group').nodes();
        for (let i = 0; i < fragmentNodes.length; i++) {
            const fragment = fragmentNodes[i];
            if (!(fragment as ElementWithData).classList.contains('clicked')) {
                return false;
            }
        }
        return true;
    }
    highlight(start: number, end: number) {
        this.protvistaManager.dispatchEvent(new CustomEvent('change', {
            detail: {
                highlight: `${start}:${end}`,
            }, bubbles: true, cancelable: true
        }));
    }

    highlightOff() {
        this.protvistaManager.dispatchEvent(new CustomEvent('change', {
            detail: {
                highlight: null,
            }, bubbles: true, cancelable: true
        }));
    }

    addTrack(urlGenerator: (url: string) => string, parser: TrackParser<any>) {
        this.tracks.push({ urlGenerator, parser })
    }
}

function updateTooltip(e: { clientY: number; clientX: number; eventtype: string },
    detail: { eventtype: string, coords: number[]; feature: Accession; target: { __data__: Fragment; }; }) {
    const previousTooltip = d3.select("protvista-tooltip");
    if (detail.eventtype == 'mouseout') {
        if (!previousTooltip.empty() && previousTooltip.classed('click-open')) {
        } else {
            removeAllTooltips();
        }
        return;
    }
    if (detail.eventtype == 'click') {
        createTooltip(detail, true);
        return;
    }
    if (detail.eventtype == 'mouseover') {
        if (!previousTooltip.empty() && previousTooltip.classed('click-open')) {
        } else {
            removeAllTooltips();
            createTooltip(detail);
        }
        return;
    }
    removeAllTooltips();
}

function createTooltip(detail: { eventtype: string; coords: number[]; feature: Accession; target: { __data__: Fragment; }; }, closeable = false) {
    if (detail.target) {
        const fragment = detail.target.__data__;
        d3.select("protvista-tooltip")
            .data([fragment])
            .enter()
            .append("protvista-tooltip");
        d3.select("protvista-tooltip")
            .attr("x", detail.coords[0])
            .attr("y", detail.coords[1])
            .attr("title", fragment.tooltipContent?.title ?? "")
            .attr("visible", true)
            .html(fragment.tooltipContent?.render() ?? "");
        if (closeable) {
            d3.select("protvista-tooltip").classed('click-open', true);
        }
    }
}

function removeAllTooltips() {
    d3.selectAll("protvista-tooltip").remove();
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