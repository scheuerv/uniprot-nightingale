import d3 = require('d3');
import categoryContainer from './category-container';
import TrackParser from '../parsers/track-parser';
import { createRow } from '../utils';
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
                        d3.create('div').node()!, navigationElement.node() as any
                    ).node() as any
                );
                const sequenceElement = d3.create('protvista-sequence').attr("length", this.sequence.length).attr("sequence", this.sequence);
                protvistaManager?.appendChild(
                    createRow(
                        d3.create('div').node()!, sequenceElement.node() as any
                    ).node() as any
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


        });
    }
    addTrack(urlGenerator: (url: string) => string, parser: TrackParser) {
        this.tracks.push({ urlGenerator, parser })
    }
}
type Track = {
    urlGenerator: (url: string) => string;
    parser: TrackParser;
}