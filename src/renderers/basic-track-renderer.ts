import TrackRenderer from './track-renderer';
import d3 = require('d3');
import { createRow } from '../utils';
import ProtvistaTrack from 'protvista-track';
import BasicTrackContainer from '../manager/track-container';
import BasicCategoryContainer from '../manager/basic-category-container';
import TooltipContent from '../tooltip-content';
import { createEmitter, Emitter, SealedEvent } from 'ts-typed-events';
import { TrackFragment } from '../manager/track-manager';
import FragmentAligner from '../parsers/fragment-aligner';

export default class BasicTrackRenderer<Output> implements TrackRenderer {
    private mainTrack: BasicTrackContainer<Accession[]>;
    private subtracks: BasicTrackContainer<Accession[]>[];
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    private emitOnArrowClick = createEmitter<TrackFragment[]>();
    public onArrowClick=this.emitOnArrowClick.event;
    constructor(private rows: TrackRow<Output>[], private mainTrackLabel: string, private emitOnLabelClick: Emitter<Output, SealedEvent<Output>> | undefined) {

    }
    getCategoryContainer(sequence: string): BasicCategoryContainer {

        [this.mainTrack, this.mainTrackRow] = this.getMainTrack(sequence);
        [this.subtracks, this.subtracksDiv] = this.getSubtracks(sequence);
        const trackContainers: BasicTrackContainer<Accession[]>[] = [];
        const categoryDiv = d3.create("div").node();
        categoryDiv!.appendChild(this.mainTrackRow.node()!);
        trackContainers.push(this.mainTrack);
        this.subtracks.forEach((subtrack, i) => {
            trackContainers.push(subtrack);
        });
        categoryDiv!.append(this.subtracksDiv!);
        return new BasicCategoryContainer(trackContainers, categoryDiv!);
    }
    private toggle() {
        if (this.subtracksDiv.style.display === 'none') {
            this.subtracksDiv.style.display = 'block';
            d3.select(this.mainTrack.track).style('display', 'none');
            this.mainTrackRow.select('.track-label.main').attr("class", "track-label main arrow-down");
        } else {
            this.subtracksDiv.style.display = 'none';
            d3.select(this.mainTrack.track).style('display', 'block');
            this.mainTrackRow.select('.track-label.main').attr('class', 'track-label main arrow-right');
        }
    }
    private getMainTrack(sequence: string): [BasicTrackContainer<Accession[]>, d3.Selection<HTMLDivElement, undefined, null, undefined>] {
        const mainTrackData = this.rows.flatMap(row => row.rowData);                
        const fragmentAligner = new FragmentAligner();
        mainTrackData.forEach(accession=>accession.locations[0].fragments.forEach(fragment=>fragmentAligner.addFragment(fragment)))
        const mainTrackDataAligned=fragmentAligner.getAccessions();
        const d3Track = d3.create("protvista-track")
            .attr("highlight-event", "onmouseover")
            .attr("height", 40)
            .attr("layout", "non-overlapping");
        const track = d3Track.node() as ProtvistaTrack;
        d3.select(track).attr("length", sequence.length);
        const mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            track,
            "main",
            true
        );
        const trackFragments: TrackFragment[] = [];
        mainTrackDataAligned.forEach(accession => {
            accession.locations[0].fragments.forEach(fragment => {
                trackFragments.push({ start: fragment.start, end: fragment.end, color: fragment.color ?? '#000000' })
            })
        });
        mainTrackRow.select(".fa-arrow-circle-right").on("click", (f, i) => {
            this.emitOnArrowClick.emit(trackFragments);
        });
        mainTrackRow.attr("class", mainTrackRow.attr("class") + " data")
        mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle()
        );
        return [new BasicTrackContainer<Accession[]>(track, mainTrackDataAligned), mainTrackRow];
    }
    private getSubtracks(sequence: string): [BasicTrackContainer<Accession[]>[], HTMLDivElement] {

        const subtrackContainers: BasicTrackContainer<Accession[]>[] = [];
        const subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node()!;
        this.rows.forEach(subtrackData => {
            const d3Track = d3.create("protvista-track")
                .attr("highlight-event", "onmouseover")
                .attr("height", 40)
                .attr("layout", "non-overlapping");
            const subtrack = d3Track.node() as ProtvistaTrack;

            d3.select(subtrack).attr("length", sequence.length);
            const labelElement = d3.create("div").text(subtrackData.label);
            if (subtrackData.output) {
                labelElement.style("cursor", "pointer");
                labelElement.on('click', () => {
                    this.emitOnLabelClick?.emit(subtrackData.output!);
                });
            }
            const subTrackRowDiv = createRow(
                labelElement.node()!,
                subtrack,
                "sub",
                true
            );
            const trackFragments: TrackFragment[] = [];
            subtrackData.rowData.forEach(accession => {
                accession.locations[0].fragments.forEach(fragment => {
                    trackFragments.push({ start: fragment.start, end: fragment.end, color: fragment.color ?? '#000000' })
                })
            });
            subTrackRowDiv.select(".fa-arrow-circle-right").on("click", (f, i) => {
                this.emitOnArrowClick.emit(trackFragments);
            });
            subtracksDiv.appendChild(subTrackRowDiv.node()!);
            subtrackContainers.push(new BasicTrackContainer<Accession[]>(subtrack, subtrackData.rowData));
        });
        return [subtrackContainers, subtracksDiv];
    }


}
export class TrackRow<Output> {
    constructor(public readonly rowData: Accession[], public readonly label: string, public readonly output?: Output) {

    }
}
export class Accession {

    readonly coverage?: number;
    readonly pdbStart?: number;
    readonly pdbEnd?: number;
    readonly uniprotStart?: number;
    readonly uniprotEnd?: number;
    constructor
        (
            readonly color: string | null,
            readonly locations: Location[],
            readonly type?: string,
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
        readonly shape?:string,
        readonly tooltipContent?: TooltipContent
    ) { }
}