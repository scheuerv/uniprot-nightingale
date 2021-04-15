import TrackRenderer from './track-renderer';
import d3 = require('d3');
import { createRow } from '../utils';
import ProtvistaTrack from 'protvista-track';
import BasicTrackContainer, { MainTrackContainer, TrackContainer } from '../manager/track-container';
import BasicCategoryContainer from '../manager/basic-category-container';
import TooltipContent from '../tooltip-content';
import { createEmitter, Emitter, SealedEvent } from 'ts-typed-events';
import { TrackFragment } from '../manager/track-manager';
import FragmentAligner from '../parsers/fragment-aligner';

export default class BasicTrackRenderer<Output> implements TrackRenderer {
    private mainTrack: MainTrackContainer<Accession[]>;
    private subtracks: BasicTrackContainer<Accession[]>[];
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    private emitOnArrowClick = createEmitter<TrackFragment[]>();
    public onArrowClick = this.emitOnArrowClick.event;
    constructor(private rows: TrackRow<Output>[], private mainTrackLabel: string, private emitOnLabelClick: Emitter<Output, SealedEvent<Output>> | undefined, private displayArrow: boolean) {

    }
    getCategoryContainer(sequence: string): BasicCategoryContainer {

        [this.mainTrack, this.mainTrackRow] = this.getMainTrack(sequence);
        [this.subtracks, this.subtracksDiv] = this.getSubtracks(sequence);
        const trackContainers: TrackContainer[] = [];
        const categoryDiv = d3.create("div").node();
        categoryDiv!.appendChild(this.mainTrackRow.node()!);
        trackContainers.push(this.mainTrack);
        this.subtracks.forEach((subtrack, i) => {
            trackContainers.push(subtrack);
        });
        categoryDiv!.append(this.subtracksDiv!);
        return new BasicCategoryContainer(trackContainers, categoryDiv!);
    }
    private toggle(sequence: string) {
        const classList = d3.select(this.mainTrack.track).node()?.parentElement!.classList;
        if (this.subtracksDiv.style.display === 'none') {
            this.subtracksDiv.style.display = 'block';
            classList?.remove("main");
            classList?.add("empty");
            this.mainTrackRow.select('.track-label.main').attr("class", "track-label main arrow-down");
        } else {
            this.subtracksDiv.style.display = 'none';
            classList?.remove("empty");
            classList?.add("main");
            this.mainTrackRow.select('.track-label.main').attr('class', 'track-label main arrow-right');
        }
    }
    private getMainTrack(sequence: string): [MainTrackContainer<Accession[]>, d3.Selection<HTMLDivElement, undefined, null, undefined>] {
        const mainTrackData = this.rows.flatMap(row => row.rowData);
        const fragmentAligner = new FragmentAligner();
        mainTrackData.forEach(accession => accession.locations[0].fragments.forEach(fragment => fragmentAligner.addFragment(fragment)))
        const mainTrackDataAligned = fragmentAligner.getAccessions();
        const track = d3.create("protvista-track")
            .attr("highlight-event", "onclick")
            .attr("height", 40)
            .attr("class", "main")
            .attr("layout", "non-overlapping")
            .attr("length", sequence.length).node() as ProtvistaTrack;

        const mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            track,
            "main",
            this.displayArrow
        );
        const emptyTrack = d3.create("protvista-track")
            .attr("height", 40)
            .attr("length", sequence.length)
            .attr("class", "empty")
            .node() as ProtvistaTrack;
        track.parentElement!.appendChild(emptyTrack);
        mainTrackRow.attr("class", mainTrackRow.attr("class") + " main")
        mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle(sequence)
        );
        return [new MainTrackContainer<Accession[]>(track, emptyTrack, mainTrackDataAligned), mainTrackRow];
    }

    private getSubtracks(sequence: string): [BasicTrackContainer<Accession[]>[], HTMLDivElement] {

        const subtrackContainers: BasicTrackContainer<Accession[]>[] = [];
        const subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node()!;
        this.rows.forEach(subtrackData => {
            const d3Track = d3.create("protvista-track")
                .attr("highlight-event", "onclick")
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
                this.displayArrow
            );
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
        readonly id: number,
        readonly start: number,
        readonly end: number,
        readonly color: string,
        readonly fill?: string,
        readonly shape?: string,
        readonly tooltipContent?: TooltipContent
    ) { }
}

export class FragmentWrapper {
    constructor(
        readonly fragmentRowTuples: [ElementWithData, RowWrapper][] = [],
        readonly fragmentData: Fragment,
    ) {
        fragmentRowTuples.forEach((fragmentRowTuple, i) => {
            d3.select(fragmentRowTuple[0]).on("click", (e) => {
                const classsList = d3.select(d3.event.currentTarget)?.node()?.classList;
                if (classsList.contains('clicked')) {
                    fragmentRowTuple[1].arrowElement.classList.remove('clicked');
                    classsList.remove('clicked');
                    fragmentRowTuples[fragmentRowTuples.length - 1 - i][0].classList.remove('clicked');
                    fragmentRowTuples[fragmentRowTuples.length - 1 - i][1].arrowElement.classList.remove('clicked');
                }
                else {
                    classsList.add('clicked');
                    fragmentRowTuples[fragmentRowTuples.length - 1 - i][0].classList.add('clicked');
                    if (this.allFragmentsInRowClicked(fragmentRowTuples[fragmentRowTuples.length - 1 - i][1], fragmentRowTuples.length - 1 - i)) {
                        fragmentRowTuples[fragmentRowTuples.length - 1 - i][1].arrowElement.classList.add('clicked');
                    }
                    if (this.allFragmentsInRowClicked(fragmentRowTuples[i][1], i)) {
                        fragmentRowTuples[i][1].arrowElement.classList.add('clicked');
                    }
                }
                //this.emitOnHighlightChange.emit(getClickedTrackFragments());
            });
        })
    }
    allFragmentsInRowClicked(row: RowWrapper, fragmentNumber: number) {
        for (let i = 0; i < row.getFragmentWrappers().length; i++) {
            if (!row.getFragmentWrappers()[i].fragmentRowTuples[fragmentNumber][0].classList.contains('clicked')) {
                return false;
            }
        }
        return true;
    }
}

export class RowWrapper {
    private fragmentWrappers: FragmentWrapper[] = [];
    constructor(
        readonly arrowElement: Element
    ) { }

    public addFragmentWrapper(fragmentWrapper: FragmentWrapper) {
        this.fragmentWrappers.push(fragmentWrapper);
    }

    public getFragmentWrappers() {
        return this.fragmentWrappers;
    }
}

export class ElementWithData extends Element {
    public __data__: Fragment;
}