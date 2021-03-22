import TrackRenderer from './track-renderer';
import d3 = require('d3');
import { createRow } from '../utils';
import ProtvistaTrack from 'protvista-track';
import BasicTrackContainer from '../manager/track-container';
import BasicCategoryContainer from '../manager/basic-category-container';
import TooltipContent from '../tooltip-content';
import { Emitter, SealedEvent } from 'ts-typed-events';

export default class BasicTrackRenderer<Output> implements TrackRenderer {
    private mainTrack: BasicTrackContainer<Accession[]>;
    private subtracks: BasicTrackContainer<Accession[]>[];
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    constructor(private rows: TrackRow<Output>[], private mainTrackLabel: string, private emitOnLabelClick: Emitter<Output, SealedEvent<Output>> | undefined) {

    }
    getCategoryContainer(sequence: string): BasicCategoryContainer {
        this.mainTrack = this.getMainTrack();
        this.subtracks = this.getSubtracks();
        const trackContainers: BasicTrackContainer<Accession[]>[] = [];
        const categoryDiv = d3.create("div").node();

        d3.select(this.mainTrack.track).attr("length", sequence.length);

        this.mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            this.mainTrack.track,
            "main"
        );
        this.mainTrackRow.attr("class", this.mainTrackRow.attr("class") + " data")
        this.mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle()
        );
        categoryDiv!.appendChild(this.mainTrackRow.node()!);
        trackContainers.push(this.mainTrack);
        this.subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node()!;
        this.subtracks.forEach((subtrack, i) => {
            d3.select(subtrack.track).attr("length", sequence.length);
            const labelElement = d3.create("div").text(this.rows[i].label);
            if (this.rows[i].output) {
                labelElement.style("cursor", "pointer");
                labelElement.on('click', () => {
                    this.emitOnLabelClick?.emit(this.rows[i].output!);
                });
            }
            const subTrackRowDiv = createRow(
                labelElement.node()!,
                subtrack.track,
                "sub"
            );
            this.subtracksDiv?.appendChild(subTrackRowDiv.node()!);
            trackContainers.push(subtrack);

        });
        categoryDiv!.append(this.subtracksDiv!);
        return new BasicCategoryContainer(trackContainers, categoryDiv!);


    }
    private toggle() {
        if (this.subtracksDiv!.style.display === 'none') {
            this.subtracksDiv!.style.display = 'block';
            d3.select(this.mainTrack.track).style('display', 'none');
            this.mainTrackRow.select('.track-label.main').attr("class", "track-label main arrow-down");
        } else {
            this.subtracksDiv!.style.display = 'none';
            d3.select(this.mainTrack.track).style('display', 'block');
            this.mainTrackRow.select('.track-label.main').attr('class', 'track-label main arrow-right');
        }
    }
    private getMainTrack(): BasicTrackContainer<Accession[]> {
        const mainTrackData = this.rows.flatMap(row => row.rowData);
        const d3Track = d3.create("protvista-track")
            .attr("highlight-event", "onmouseover")
            .attr("height", 40)
            .attr("layout", "non-overlapping");
        return new BasicTrackContainer<Accession[]>(d3Track.node() as ProtvistaTrack, mainTrackData);
    }
    private getSubtracks(): BasicTrackContainer<Accession[]>[] {
        const subtrackContainers: BasicTrackContainer<Accession[]>[] = [];
        this.rows.forEach(subtrackData => {
            const d3Track = d3.create("protvista-track")
                .attr("highlight-event", "onmouseover")
                .attr("height", 40)
                .attr("layout", "non-overlapping");
            subtrackContainers.push(new BasicTrackContainer<Accession[]>(d3Track.node() as ProtvistaTrack, subtrackData.rowData));
        });
        return subtrackContainers;
    }


}
export class TrackRow<Output> {
    constructor(public readonly rowData: Accession[], public readonly label: string, public readonly output?: Output) {

    }
}
export class Accession {

    readonly coverage: number;
    readonly pdbStart: number;
    readonly pdbEnd: number;
    readonly uniprotStart: number;
    readonly uniprotEnd: number;
    constructor
        (
            readonly color: string | null,
            readonly locations: Location[],
            readonly type: string,
            readonly experimentalMethod?: string,
            readonly coordinatesFile?: string
        ) { }
}
export class Location {
    constructor
        (
            readonly fragments: Fragment[]
        ) { }

}

export class Fragment {
    constructor(
        readonly start: number,
        readonly end: number,
        readonly color?: string,
        readonly fill?: string,
        readonly tooltipContent?: TooltipContent
    ) { }
}