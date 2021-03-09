import d3 = require('d3');
import TrackContainer from './track-container';
import TrackParser from './track-parser';
export default class TrackManager {
    private tracks: Track[] = [];
    private sequence: string = "";
    constructor(private sequenceUrlGenerator: (url: string) => string) {

    }
    async render(uniprotId: string, element: HTMLElement) {



        let protvistaManager = d3.create("protvista-manager")
            .attr("attributes", "length displaystart displayend highlightstart highlightend activefilters filters")
            .node();
        fetch(this.sequenceUrlGenerator(uniprotId)).then(data => data.text())
            .then(data => {
                let tokens = data.split(/\r?\n/);
                for (let i = 1; i < tokens.length; i++) {
                    this.sequence += tokens[i];
                }
                let navigationElement = d3.create('protvista-navigation').attr("length", this.sequence.length);
                protvistaManager?.appendChild(navigationElement.node() as any);
                let sequenceElement = d3.create('protvista-sequence').attr("length", this.sequence.length).attr("sequence", this.sequence);
                protvistaManager?.appendChild(sequenceElement.node() as any);
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

            let trackContainers: TrackContainer[] = [];
            renderers
                .filter(renderer => renderer != null)
                .map(renderer => renderer!)
                .forEach(renderer => {
                    let subtracks = renderer.getSubtracks();
                    let div = document.createElement("div");
                    let mainTrack = renderer.getMainTrack();
                    d3.select(mainTrack.track as any).attr("length", this.sequence.length);
                    trackContainers.push(mainTrack);
                    div.appendChild(mainTrack.track as any);
                    subtracks.forEach(subtrack => {
                        div.appendChild(subtrack.track as any);
                        d3.select(subtrack.track as any).attr("length", this.sequence.length);
                        trackContainers.push(subtrack);
                    });
                    protvistaManager?.appendChild(div as any);
                });
            element.appendChild(protvistaManager!);
            trackContainers.forEach(tC => tC.addData());


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