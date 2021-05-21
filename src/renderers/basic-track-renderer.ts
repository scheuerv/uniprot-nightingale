import TrackRenderer from './track-renderer';
import d3 = require('d3');
import { createRow } from '../utils';
import ProtvistaTrack from 'protvista-track';
import BasicTrackContainer, { MainTrackContainer, TrackContainer } from '../manager/track-container';
import BasicCategoryContainer from '../manager/basic-category-container';
import TooltipContent from '../tooltip-content';
import { createEmitter } from 'ts-typed-events';
import { Output, TrackFragment } from '../manager/track-manager';
import FragmentAligner from '../parsers/fragment-aligner';

export default class BasicTrackRenderer implements TrackRenderer {
    private mainTrack: MainTrackContainer<Accession[]>;
    private subtracks: BasicTrackContainer[];
    private subtracksDiv: HTMLDivElement;
    private mainTrackRow: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    constructor(
        private readonly rows: Map<string, TrackRow>,
        private readonly mainTrackLabel: string,
        private readonly displayArrow: boolean,
        public readonly categoryName: string
    ) {

    }
    public combine(other: TrackRenderer): TrackRenderer {
        if (other instanceof BasicTrackRenderer) {
            const combined: Map<string, TrackRow> = new Map();
            this.rows.forEach((row, type) => {
                combined.set(type, row)
            })
            let maxId = Math.max.apply(Math, Array.from(other.rows.values())
                .flatMap(trackRow => trackRow.rowData)
                .flatMap(typeRowDatum => typeRowDatum.locations[0].fragments)
                .map(fragment => fragment.id));
            other.rows.forEach((otherTypeRow, type) => {
                const thisTypeRow = combined.get(type);
                if (thisTypeRow) {
                    const accessionsWithFixedId = thisTypeRow.rowData.map(accession => {
                        const fragmentsWithFixedId = accession.locations[0].fragments.map(fragment => {
                            if (fragment.id <= maxId) {
                                return new Fragment(++maxId, fragment.start, fragment.end, fragment.color, fragment.fill, fragment.shape, fragment.tooltipContent, fragment.output)
                            }
                            else {
                                return fragment
                            }
                        });
                        return new Accession(accession.color, [new Location(fragmentsWithFixedId)], accession.type, accession.experimentalMethod);
                    })
                    const combinedTrackRow = new TrackRow(otherTypeRow.rowData.concat(accessionsWithFixedId), otherTypeRow.label, otherTypeRow.output);
                    combined.set(type, combinedTrackRow);
                }
                else {
                    combined.set(type, otherTypeRow);
                }
            })
            return new BasicTrackRenderer(combined, other.mainTrackLabel, other.displayArrow, other.categoryName)
        } else {
            throw new Error("Can't combine BasicTrackRenderer with: " + (typeof other));
        }
    }
    public getCategoryContainer(sequence: string): BasicCategoryContainer {

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
    private toggle() {
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
        const mainTrackData = Array.from(this.rows.values()).flatMap(row => row.rowData);
        const fragmentAligner = new FragmentAligner();
        mainTrackData.forEach(accession => accession.locations[0].fragments.forEach(fragment => fragmentAligner.addFragment(fragment)))
        const mainTrackDataAligned = fragmentAligner.getAccessions();
        const track = d3.create("protvista-track")
            .attr("highlight-event", "none")
            .attr("height", 44)
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
            .attr("height", 44)
            .attr("length", sequence.length)
            .attr("class", "empty")
            .node() as ProtvistaTrack;
        track.parentElement!.appendChild(emptyTrack);
        mainTrackRow.attr("class", mainTrackRow.attr("class") + " main")
        mainTrackRow.select(".track-label").attr("class", "track-label main arrow-right").on('click', () =>
            this.toggle()
        );
        return [new MainTrackContainer<Accession[]>(track, emptyTrack, mainTrackDataAligned), mainTrackRow];
    }

    private getSubtracks(sequence: string): [BasicTrackContainer[], HTMLDivElement] {
        const subtrackContainers: BasicTrackContainer[] = [];
        const subtracksDiv = d3.create("div").attr("class", "subtracks-container").style("display", "none").node()!;
        if (this.rows.size >= 5) {
            subtracksDiv.classList.add('scrollable');
            subtracksDiv.style.maxHeight = this.rows.size * 43 + 'px';
        }
        this.rows.forEach(subtrackData => {
            const d3Track = d3.create("protvista-track")
                .attr("highlight-event", "none")
                .attr("height", 44)
                .attr("layout", "non-overlapping");
            const subtrack = d3Track.node() as ProtvistaTrack;

            d3.select(subtrack).attr("length", sequence.length);
            const labelElement = d3.create("div").text(subtrackData.label);
            const subTrackRowDiv = createRow(
                labelElement.node()!,
                subtrack,
                "sub",
                this.displayArrow
            );
            subtracksDiv.appendChild(subTrackRowDiv.node()!);
            subtrackContainers.push(new BasicTrackContainer(subtrack, subtrackData, labelElement));
        });
        return [subtrackContainers, subtracksDiv];
    }

}
export class TrackRow {
    constructor(public readonly rowData: Accession[], public readonly label: string, public readonly output?: Output) {

    }
}
export class Accession {
    constructor
        (
            public readonly color: string | null,
            public readonly locations: Location[],
            public readonly type?: string,
            public readonly experimentalMethod?: string
        ) { }
}
export class Location {
    constructor
        (
            public readonly fragments: Fragment[]
        ) { }

}

export class Fragment {
    constructor(
        public readonly id: number,
        public readonly start: number,
        public readonly end: number,
        public readonly color: string,
        public readonly fill?: string,
        public readonly shape?: string,
        public readonly tooltipContent?: TooltipContent,
        public readonly output?: Output
    ) { }
}

export class FragmentWrapper {
    private readonly emitOnClick = createEmitter<boolean>();
    public readonly onClick = this.emitOnClick.event;
    private readonly emitOnMarkedChange = createEmitter<boolean>();
    public readonly onMarkedChange = this.emitOnMarkedChange.event;
    private isMarked = false;
    constructor(
        public readonly fragmentElements: ElementWithData[] = [],
        public readonly fragmentData: Fragment,
    ) {
        fragmentElements.forEach((fragmentElement, i) => {
            d3.select(fragmentElement).on("click", () => {
                if (this.isMarked) {
                    this.unmark();
                }
                else {
                    this.mark();
                }
                this.emitOnClick(this.isMarked);
            });
        })
    }
    public mark() {
        if (!this.isMarked) {
            this.fragmentElements.forEach(fragmentElement => {
                fragmentElement.classList.add('clicked');
            })
            this.isMarked = true;
            this.emitOnMarkedChange(this.isMarked);
        }
    }
    public unmark() {
        if (this.isMarked) {
            this.fragmentElements.forEach(fragmentElement => {
                fragmentElement.classList.remove('clicked');
            })
            this.isMarked = false;
            this.emitOnMarkedChange(this.isMarked);
        }
    }
}

export class RowWrapper {
    private readonly markedFragments = new Set<FragmentWrapper>();
    private readonly higlightedFragments = new Set<FragmentWrapper>();
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    constructor(
        readonly arrowElement: Element,
        readonly fragmentWrappers: FragmentWrapper[]
    ) {
        d3.select(arrowElement).on("click", this.arrowClick());
        fragmentWrappers.forEach(fragmentWrapper => {
            fragmentWrapper.onClick.on(isMarked => {
                this.emitOnHighlightChange.emit(this.getMarkedTrackFragments());
            });
            fragmentWrapper.onMarkedChange.on(isMarked => {
                if (isMarked) {
                    if (d3.event.shiftKey) {
                        this.higlightedFragments.add(fragmentWrapper);
                    }
                    this.markedFragments.add(fragmentWrapper);
                    if (this.markedFragments.size == this.fragmentWrappers.length) {
                        this.arrowElement.classList.add('clicked');
                    }
                }
                else {
                    this.higlightedFragments.delete(fragmentWrapper);
                    this.markedFragments.delete(fragmentWrapper);
                    this.arrowElement.classList.remove('clicked');
                }
            })
        });
    }
    private arrowClick() {
        return () => {
            d3.event.stopPropagation();
            if (this.arrowElement.classList.contains("clicked")) {
                this.fragmentWrappers.forEach(fragment => {
                    fragment.unmark();
                });
            } else {
                this.fragmentWrappers.forEach(fragment => {
                    fragment.mark();
                });
            }
            this.emitOnHighlightChange.emit(this.getMarkedTrackFragments());
        }
    }
    public getMarkedTrackFragments() {
        return Array.from(this.markedFragments).map(fragmentWrapper => {
            return { start: fragmentWrapper.fragmentData.start, end: fragmentWrapper.fragmentData.end, color: fragmentWrapper.fragmentData.color };
        });
    }
    public getHighlightedTrackFragments() {
        return Array.from(this.higlightedFragments).map(fragmentWrapper => {
            return { start: fragmentWrapper.fragmentData.start, end: fragmentWrapper.fragmentData.end, color: fragmentWrapper.fragmentData.color };
        });
    }
    public clearHighlightedTrackFragments() {
        this.higlightedFragments.clear();
    }
}

export class RowWrapperBuilder {
    private readonly fragmentWrappers: FragmentWrapper[] = [];
    constructor(
        public readonly arrowElement: Element
    ) { }

    public addFragmentWrapper(fragmentWrapper: FragmentWrapper) {
        this.fragmentWrappers.push(fragmentWrapper);
    }

    public build() {
        return new RowWrapper(this.arrowElement, this.fragmentWrappers)
    }
}

export class ElementWithData extends Element {
    public readonly __data__: Fragment;
}