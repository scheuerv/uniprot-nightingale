import TrackRenderer from './track-renderer';
import d3 = require('d3');
// @ts-ignore
import ProtvistaTrack from 'protvista-track';
import TrackContainer from './track-container';
export default class BasicTrackRenderer implements TrackRenderer {
    constructor(private rows: TrackRow[]) {
    }
    getMainTrack():TrackContainer {
        let mainTrackData = this.rows.flatMap(row=>row.rowData);
        let d3Track = d3.create("protvista-track")
            .attr("highlight-event", "onmouseover")
            .attr("height", 40)
            .attr("layout","non-overlapping");
        let track = (d3Track.node() as any) as ProtvistaTrack;
        
        return new TrackContainer(track,mainTrackData);
    }
    getSubtracks(): TrackContainer[] {
        let subtrackContainers: TrackContainer[] = [];
        this.rows.forEach(subtrackData => {
            let d3Track = d3.create("protvista-track")
                .attr("highlight-event", "onmouseover")
                .attr("height", 40)
                .attr("layout","non-overlapping");
            let track = (d3Track.node() as any) as ProtvistaTrack;
            subtrackContainers.push(new TrackContainer(track,subtrackData.rowData));
        });
        return subtrackContainers;
    }

}
export class TrackRow{
    constructor(public rowData: Accession[])
    {

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