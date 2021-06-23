import TrackRenderer from "./track-renderer";
import * as d3 from "d3";
import { createRow } from "../utils/utils";
import ProtvistaTrack from "protvista-track";
import TrackContainer from "../manager/track-container";
import BasicCategoryContainer from "../manager/basic-category-container";
import FragmentAligner from "../parsers/fragment-aligner";
import BasicTrackContainer from "../manager/basic-track-container";
import MainTrackContainer from "../manager/main-track-container";
import { Accession, Fragment, Location, TrackRow } from "../types/accession";

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
    ) {}
    public combine(other: TrackRenderer): TrackRenderer {
        if (other instanceof BasicTrackRenderer) {
            const combined: Map<string, TrackRow> = new Map();
            let maxId = Math.max(
                ...Array.from(other.rows.values())
                    .flatMap((trackRow) => trackRow.rowData)
                    .flatMap((typeRowDatum) => typeRowDatum.locations[0].fragments)
                    .map((fragment) => fragment.id)
            );
            this.rows.forEach((thisTypeRow, type) => {
                const accessionsWithFixedId = thisTypeRow.rowData.map((accession) => {
                    const fragmentsWithFixedId = accession.locations[0].fragments.map(
                        (fragment) => {
                            if (fragment.id <= maxId) {
                                return new Fragment(
                                    ++maxId,
                                    fragment.start,
                                    fragment.end,
                                    fragment.color,
                                    fragment.fill,
                                    fragment.shape,
                                    fragment.tooltipContent,
                                    fragment.output
                                );
                            } else {
                                return fragment;
                            }
                        }
                    );
                    return new Accession([new Location(fragmentsWithFixedId)]);
                });
                combined.set(
                    type,
                    new TrackRow(accessionsWithFixedId, thisTypeRow.label, thisTypeRow.output)
                );
            });
            other.rows.forEach((otherTypeRow, type) => {
                const thisTypeRow = combined.get(type);
                if (thisTypeRow) {
                    const combinedTrackRow = new TrackRow(
                        otherTypeRow.rowData.concat(thisTypeRow.rowData),
                        otherTypeRow.label,
                        otherTypeRow.output
                    );
                    combined.set(type, combinedTrackRow);
                } else {
                    combined.set(type, otherTypeRow);
                }
            });
            return new BasicTrackRenderer(
                combined,
                other.mainTrackLabel,
                other.displayArrow,
                other.categoryName
            );
        } else {
            throw new Error("Can't combine BasicTrackRenderer with: " + typeof other);
        }
    }
    public getCategoryContainer(sequence: string): BasicCategoryContainer {
        [this.mainTrack, this.mainTrackRow] = this.getMainTrack(sequence);
        [this.subtracks, this.subtracksDiv] = this.getSubtracks(sequence);
        const trackContainers: TrackContainer[] = [];
        const categoryDiv = d3.create("div").node()!;
        categoryDiv.appendChild(this.mainTrackRow.node()!);
        trackContainers.push(this.mainTrack);
        this.subtracks.forEach((subtrack) => {
            trackContainers.push(subtrack);
        });
        categoryDiv.append(this.subtracksDiv);
        return new BasicCategoryContainer(trackContainers, categoryDiv);
    }
    private toggle() {
        const classList = d3.select(this.mainTrack.track).node()?.parentElement!.classList;
        if (this.subtracksDiv.style.display === "none") {
            this.subtracksDiv.style.display = "block";
            classList?.remove("main");
            classList?.add("empty");
            this.mainTrackRow
                .select(".track-label.main")
                .attr("class", "track-label main arrow-down");
        } else {
            this.subtracksDiv.style.display = "none";
            classList?.remove("empty");
            classList?.add("main");
            this.mainTrackRow
                .select(".track-label.main")
                .attr("class", "track-label main arrow-right");
        }
    }
    private getMainTrack(
        sequence: string
    ): [MainTrackContainer<Accession[]>, d3.Selection<HTMLDivElement, undefined, null, undefined>] {
        const mainTrackData = Array.from(this.rows.values()).flatMap((row) => row.rowData);
        const fragmentAligner = new FragmentAligner();
        mainTrackData.forEach((accession) =>
            accession.locations[0].fragments.forEach((fragment) =>
                fragmentAligner.addFragment(fragment)
            )
        );
        const mainTrackDataAligned = fragmentAligner.getAccessions();
        const track = d3
            .create("protvista-track")
            .attr("highlight-event", "none")
            .attr("height", 44)
            .attr("class", "main")
            .attr("layout", "non-overlapping")
            .attr("length", sequence.length)
            .node() as ProtvistaTrack;

        const mainTrackRow = createRow(
            document.createTextNode(this.mainTrackLabel),
            track,
            "main",
            this.displayArrow
        );
        const emptyTrack = d3
            .create("protvista-track")
            .attr("height", 44)
            .attr("length", sequence.length)
            .attr("class", "empty")
            .node() as ProtvistaTrack;
        track.parentElement!.appendChild(emptyTrack);
        mainTrackRow.attr("class", mainTrackRow.attr("class") + " main");
        mainTrackRow
            .select(".track-label")
            .attr("class", "track-label main arrow-right")
            .on("click", () => this.toggle());
        return [
            new MainTrackContainer<Accession[]>(track, emptyTrack, mainTrackDataAligned),
            mainTrackRow
        ];
    }

    private getSubtracks(sequence: string): [BasicTrackContainer[], HTMLDivElement] {
        const subtrackContainers: BasicTrackContainer[] = [];
        const subtracksDiv = d3
            .create("div")
            .attr("class", "subtracks-container")
            .style("display", "none")
            .node()!;
        if (this.rows.size >= 5) {
            subtracksDiv.classList.add("scrollable");
            subtracksDiv.style.maxHeight = this.rows.size * 43 + "px";
        }
        this.rows.forEach((subtrackData) => {
            const d3Track = d3
                .create("protvista-track")
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
