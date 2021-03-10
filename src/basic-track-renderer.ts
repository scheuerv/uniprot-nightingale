import TrackRenderer from './track-renderer';
import d3 = require('d3');
import { createRow } from './utils';
// @ts-ignore
import ProtvistaTrack from 'protvista-track';
import TrackContainer from './track-container';
import CategoryContainer from './category-container';
export default class BasicTrackRenderer implements TrackRenderer {
    private mainTrack: TrackContainer;
    private subtracks: TrackContainer[];
    private subtracksDiv: HTMLDivElement | null;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    constructor(private rows: TrackRow[]) {
        this.mainTrack = this.getMainTrack();
        this.subtracks = this.getSubtracks();

    }
    getCategoryContainer(sequence: string): CategoryContainer {
        let trackContainers: TrackContainer[] = [];
        let categoryDiv = d3.create("div").node();

        d3.select(this.mainTrack.track as any).attr("length", sequence.length);
        //  d3.append("div").attr("class", "track-content").node()?.appendChild(this.mainTrack.track as any);

        this.mainTrackRow = createRow(
            d3.create("div").text("main").node()!,
            this.mainTrack.track as any,
            "main arrow-right"
        )
        this.mainTrackRow.select(".track-label").on('click', () =>
            this.toggle()
        )
        categoryDiv!.appendChild(this.mainTrackRow.node()!);
        trackContainers.push(this.mainTrack);
        this.subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node();
        this.subtracks.forEach(subtrack => {
            d3.select(subtrack.track as any).attr("length", sequence.length);
            let trackRowDiv = createRow(
                d3.create("div").text("sub").node()!,
                subtrack.track as any,
                "sub"
            );
            this.subtracksDiv?.appendChild(trackRowDiv.node() as any);
            trackContainers.push(subtrack);

        });
        categoryDiv!.append(this.subtracksDiv!);
        return new CategoryContainer(trackContainers, categoryDiv!);


    }
    toggle() {
        if (this.subtracksDiv!.style.display === 'none') {
            this.subtracksDiv!.style.display = 'block';
            d3.select(this.mainTrack.track as any).style('display', 'none');
            this.mainTrackRow.select('.track-label.main').attr("class", "track-label main arrow-down");
        } else {
            this.subtracksDiv!.style.display = 'none';
            d3.select(this.mainTrack.track as any).style('display', 'block');
            this.mainTrackRow.select('.track-label.main').attr('class', 'track-label main arrow-right');
        }
    }
    getMainTrack(): TrackContainer {
        let mainTrackData = this.rows.flatMap(row => row.rowData);
        let d3Track = d3.create("protvista-track")
            .attr("highlight-event", "onmouseover")
            .attr("height", 40)
            .attr("layout", "non-overlapping");
        let track = (d3Track.node() as any) as ProtvistaTrack;

        return new TrackContainer(track, mainTrackData);
    }
    getSubtracks(): TrackContainer[] {
        let subtrackContainers: TrackContainer[] = [];
        this.rows.forEach(subtrackData => {
            let d3Track = d3.create("protvista-track")
                .attr("highlight-event", "onmouseover")
                .attr("height", 40)
                .attr("layout", "non-overlapping");
            let track = (d3Track.node() as any) as ProtvistaTrack;
            subtrackContainers.push(new TrackContainer(track, subtrackData.rowData));
        });
        return subtrackContainers;
    }


}
export class TrackRow {
    constructor(public rowData: Accession[]) {

    }
}
export class Accession {
    constructor
        (
            public accession: string,
            public color: string | null,
            public locations: Location[],
            public type: string
        ) { }
}
export class Location {
    constructor
        (
            public fragments: Fragment[],
            public start?: number,
            public end?: number
        ) { }

}

export class Fragment {
    constructor(
        public start: number,
        public end: number

    ) { }
}