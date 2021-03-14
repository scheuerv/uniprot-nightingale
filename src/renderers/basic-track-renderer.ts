import TrackRenderer from './track-renderer';
import d3 = require('d3');
import { createRow } from '../utils';
// @ts-ignore
import ProtvistaTrack from 'protvista-track';
import TrackContainer from '../manager/track-container';
import BasicCategoryContainer from '../manager/basic-category-container';
import TooltipContent from 'src/tooltip-content';
export default class BasicTrackRenderer implements TrackRenderer {
    private mainTrack: TrackContainer;
    private subtracks: TrackContainer[];
    private subtracksDiv: HTMLDivElement | null;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    constructor(private rows: TrackRow[], private mainTrackLabel: string) {

    }
    getCategoryContainer(sequence: string): BasicCategoryContainer {
        this.mainTrack = this.getMainTrack();
        this.subtracks = this.getSubtracks();
        const trackContainers: TrackContainer[] = [];
        const categoryDiv = d3.create("div").node();

        d3.select(this.mainTrack.track as any).attr("length", sequence.length);

        this.mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            this.mainTrack.track as any,
            "main"
        );
        this.mainTrackRow.attr("class", this.mainTrackRow.attr("class") + " data")
        this.mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle()
        );
        categoryDiv!.appendChild(this.mainTrackRow.node()!);
        trackContainers.push(this.mainTrack);
        this.subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node();
        this.subtracks.forEach((subtrack, i) => {
            d3.select(subtrack.track as any).attr("length", sequence.length);
            const trackRowDiv = createRow(
                d3.create("div").text(this.rows[i].label).node()!,
                subtrack.track as any,
                "sub"
            );
            this.subtracksDiv?.appendChild(trackRowDiv.node() as any);
            trackContainers.push(subtrack);

        });
        categoryDiv!.append(this.subtracksDiv!);
        return new BasicCategoryContainer(trackContainers, categoryDiv!);


    }
    private toggle() {
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
    private getMainTrack(): TrackContainer {
        const mainTrackData = this.rows.flatMap(row => row.rowData);
        const d3Track = d3.create("protvista-track")
            .attr("highlight-event", "onmouseover")
            .attr("height", 40)
            .attr("layout", "non-overlapping");
        const track = (d3Track.node() as any) as ProtvistaTrack;

        return new TrackContainer(track, mainTrackData);
    }
    private getSubtracks(): TrackContainer[] {
        const subtrackContainers: TrackContainer[] = [];
        this.rows.forEach(subtrackData => {
            const d3Track = d3.create("protvista-track")
                .attr("highlight-event", "onmouseover")
                .attr("height", 40)
                .attr("layout", "non-overlapping");
            const track = (d3Track.node() as any) as ProtvistaTrack;
            subtrackContainers.push(new TrackContainer(track, subtrackData.rowData));
        });
        return subtrackContainers;
    }


}
export class TrackRow {
    constructor(public rowData: Accession[], public label: string) {

    }
}
export class Accession {
    public experimentalMethod: string | null;
    public coverage: number;
    public pdbStart: number;
    public pdbEnd: number;
    public uniprotStart: number;
    public uniprotEnd: number;
    public coordinatesFile: string | null;
    constructor
        (
            public color: string | null,
            public locations: Location[],
            public type: string
        ) { }
}
export class Location {
    constructor
        (
            public fragments: Fragment[]
        ) { }

}

export class Fragment {
    constructor(
        public start: number,
        public end: number,
        public color?: string,
        public fill?: string,
        public tooltipContent?:TooltipContent
    ) { }
}