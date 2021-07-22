import CategoryRenderer from "./category-renderer";
import $ from "jquery";
import { createRow } from "../../../utils/utils";
import ProtvistaTrack from "protvista-track";
import TrackContainer from "../../track-containers/track-container";
import BasicCategoryContainer from "../../category-containers/basic-category-container";
import FragmentAligner from "../parsers/fragment-aligner";
import BasicTrackContainer from "../../track-containers/basic-track-container";
import MainTrackContainer from "../../track-containers/main-track-container";
import { Accession, Fragment, Location, TrackRow } from "../../../types/accession";

export default class BasicCategoryRenderer implements CategoryRenderer {
    private mainTrack: MainTrackContainer;
    private subtracks: BasicTrackContainer[];
    private subtracksDiv: HTMLElement;
    private mainTrackRow: JQuery<HTMLElement>;
    constructor(
        private readonly rows: Map<string, TrackRow>,
        private readonly mainTrackLabel: string,
        private readonly displayArrow: boolean,
        public readonly categoryName: string
    ) {}

    /**
     * Creates BasicCategoryRenderer from the combined data of
     * this BasicCategoryRenderer and other BasicCategoryRenderer.
     * All data reamins the same only ids of some fragmnets are updated
     * so they are unique.
     */
    public combine(other: CategoryRenderer): CategoryRenderer {
        if (other instanceof BasicCategoryRenderer) {
            const combined: Map<string, TrackRow> = new Map();
            let maxId = Math.max(
                ...[...other.rows.values()]
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
                                    fragment.structureInfo
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
                    new TrackRow(
                        accessionsWithFixedId,
                        thisTypeRow.label,
                        thisTypeRow.structureInfo
                    )
                );
            });
            other.rows.forEach((otherTypeRow, type) => {
                const thisTypeRow = combined.get(type);
                if (thisTypeRow) {
                    const combinedTrackRow = new TrackRow(
                        otherTypeRow.rowData.concat(thisTypeRow.rowData),
                        otherTypeRow.label,
                        otherTypeRow.structureInfo
                    );
                    combined.set(type, combinedTrackRow);
                } else {
                    combined.set(type, otherTypeRow);
                }
            });
            return new BasicCategoryRenderer(
                combined,
                other.mainTrackLabel,
                other.displayArrow,
                other.categoryName
            );
        } else {
            throw new Error("Can't combine BasicCategoryRenderer with: " + typeof other);
        }
    }

    /**
     * From data provided in constructor and using current sequence it assembles
     * (sub)tracks and main track (aggregated from subtracks) and puts them
     * inside BasicCategoryContainer together with their data.
     *
     * Tracks (TrackContainer) are usually compiled from label and some protvista
     * component with data.
     */
    public createCategoryContainer(sequence: string): BasicCategoryContainer {
        [this.mainTrack, this.mainTrackRow] = this.getMainTrack(sequence);
        [this.subtracks, this.subtracksDiv] = this.getSubtracks(sequence);
        const trackContainers: TrackContainer[] = [];
        const categoryDiv = $("<div/>");
        categoryDiv.append(this.mainTrackRow);
        trackContainers.push(this.mainTrack);
        this.subtracks.forEach((subtrack) => {
            trackContainers.push(subtrack);
        });
        categoryDiv.append(this.subtracksDiv);
        return new BasicCategoryContainer(trackContainers, categoryDiv[0]);
    }

    /**
     * Hides/opens subtracks (when subtracks are displayed main track is not visible).
     */
    private toggle(): void {
        const parent = $(this.mainTrack.track).parent();
        if (this.subtracksDiv.style.display === "none") {
            this.subtracksDiv.style.display = "block";
            parent.removeClass("main");
            parent.addClass("empty");
            this.mainTrackRow
                .find(".un-track-label.main")
                .addClass("arrow-down")
                .removeClass("arrow-right");
        } else {
            this.subtracksDiv.style.display = "none";
            parent.removeClass("empty");
            parent.addClass("main");
            this.mainTrackRow
                .find(".un-track-label.main")
                .addClass("arrow-right")
                .removeClass("arrow-down");
        }
    }

    /**
     * Combines all fragments from all subtracks and puts them together using FragmentAligner
     * into MainTrackContainer together with a new protvista track.
     */
    private getMainTrack(sequence: string): [MainTrackContainer, JQuery<HTMLElement>] {
        const mainTrackData = [...this.rows.values()].flatMap((row) => row.rowData);
        const fragmentAligner = new FragmentAligner();
        mainTrackData.forEach((accession) =>
            accession.locations[0].fragments.forEach((fragment) =>
                fragmentAligner.addFragment(fragment)
            )
        );
        const mainTrackDataAligned = fragmentAligner.alignFragments();
        const track = $("<protvista-track/>")
            .attr("highlight-event", "none")
            .attr("height", 44)
            .addClass("main")
            .attr("layout", "non-overlapping")
            .attr("length", sequence.length)[0] as ProtvistaTrack;

        const mainTrackRow = createRow(
            $(document.createTextNode(this.mainTrackLabel)),
            $(track),
            "main",
            this.displayArrow
        );
        const emptyTrack = $("<protvista-track/>")
            .attr("height", 44)
            .attr("length", sequence.length)
            .addClass("empty")[0] as ProtvistaTrack;
        track.parentElement!.appendChild(emptyTrack);
        mainTrackRow.addClass("main");
        mainTrackRow
            .find(".un-track-label")
            .addClass("arrow-right")
            .removeClass("arrow-down")
            .on("click", () => this.toggle());
        return [
            new MainTrackContainer(
                track,
                emptyTrack,
                new TrackRow(mainTrackDataAligned, this.mainTrackLabel)
            ),
            mainTrackRow
        ];
    }

    private getSubtracks(sequence: string): [BasicTrackContainer[], HTMLElement] {
        const subtrackContainers: BasicTrackContainer[] = [];
        const subtracksDiv = $("<div/>").addClass("un-subtracks-container").css("display", "none");
        if (this.rows.size >= 5) {
            subtracksDiv.addClass("scrollable");
            subtracksDiv.css("maxHeight", this.rows.size * 43 + "px");
        }
        this.rows.forEach((subtrackData) => {
            const subTrack = $("<protvista-track/>")
                .attr("highlight-event", "none")
                .attr("height", 44)
                .attr("layout", "non-overlapping")
                .attr("length", sequence.length);
            const labelElement = $("<div/>").text(subtrackData.label);
            const subTrackRowDiv = createRow(labelElement, subTrack, "sub", this.displayArrow);
            subtracksDiv.append(subTrackRowDiv[0]);
            subtrackContainers.push(
                new BasicTrackContainer(subTrack[0] as ProtvistaTrack, subtrackData, labelElement)
            );
        });
        return [subtrackContainers, subtracksDiv[0]];
    }
}
