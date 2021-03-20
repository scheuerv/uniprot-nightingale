import d3 = require('d3');
import categoryContainer from './category-container';
import TrackParser from '../parsers/track-parser';
import { createRow } from '../utils';
import { Accession, Fragment } from 'src/renderers/basic-track-renderer';
export default class TrackManager {
    private tracks: Track[] = [];
    private sequence: string = "";
    constructor(private sequenceUrlGenerator: (url: string) => string) {

    }
    async render(uniprotId: string, element: HTMLElement) {



        const protvistaManager = d3.create("protvista-manager")
            .attr("attributes", "length displaystart displayend highlightstart highlightend activefilters filters")
            .node();
        fetch(this.sequenceUrlGenerator(uniprotId)).then(data => data.text())
            .then(data => {
                const tokens = data.split(/\r?\n/);
                for (let i = 1; i < tokens.length; i++) {
                    this.sequence += tokens[i];
                }
                const navigationElement = d3.create('protvista-navigation').attr("length", this.sequence.length);
                protvistaManager?.appendChild(
                    createRow(
                        d3.create('div').node()!, navigationElement.node()!
                    ).node()!
                );
                const sequenceElement = d3.create('protvista-sequence').attr("length", this.sequence.length).attr("sequence", this.sequence);
                protvistaManager?.appendChild(
                    createRow(
                        d3.create('div').node()!, sequenceElement.node()!
                    ).node()!
                );
            });

        Promise.all(
            this.tracks.map(
                track => fetch(track.urlGenerator(uniprotId))
                    .then(
                        data => data.json().then(data => {
                            return track.parser.parse(uniprotId, data);
                        }), err => {
                            console.log(`API unavailable!`, err);
                            return Promise.reject();
                        }
                    )
            )
        ).then(renderers => {

            const categoryContainers: categoryContainer[] = [];
            renderers
                .filter(renderer => renderer != null)
                .map(renderer => renderer!)
                .forEach(renderer => {
                    const categoryContainer = renderer.getCategoryContainer(this.sequence);
                    categoryContainers.push(categoryContainer);
                    protvistaManager?.appendChild(categoryContainer.getContent());
                });

            element.appendChild(protvistaManager!);
            categoryContainers.forEach(categoryContainer => categoryContainer.addData());
            d3.selectAll("protvista-track").on("change", (f, i) => {
                const e = d3.event;
                createTooltip(e, e.detail);
            });
        });
    }
    addTrack(urlGenerator: (url: string) => string, parser: TrackParser) {
        this.tracks.push({ urlGenerator, parser })
    }
}

function createTooltip(e: { clientY: number; clientX: number; eventtype: string },
    d: { eventtype: string, coords: number[]; feature: Accession; target: { __data__: Fragment; }; }) {
    if (d.eventtype != 'mouseover') {
        return;
    }
    const fragment = d.target.__data__;
    d3.select("protvista-tooltip")
        .data([fragment])
        .enter()
        .append("protvista-tooltip");

    d3.select("protvista-tooltip")
        .attr("x", d.coords[0])
        .attr("y", d.coords[1])
        .attr("title", fragment.tooltipContent?.getTitle() ?? "")
        .attr("visible", true)
        .html(fragment.tooltipContent?.render() ?? "")
        .exit()
        .remove();
}
type Track = {
    urlGenerator: (url: string) => string;
    parser: TrackParser;
}