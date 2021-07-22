import { TrackFragment } from "../../types/accession";
import { SealedEvent } from "ts-typed-events";
import TrackContainer from "../track-containers/track-container";

/**
 * Interface for classes which represent containers for one category,
 * which usually means it contains some main track and one or more
 * subtracks. These tracks usually contains protvista components,
 * into which cannot be supplied data until they are inside DOM
 * tree (which should be announced using addData method).
 *
 * Another responsibility of classes implementing this interface
 * is to maintain highlighted and marked track fragments (annotations).
 */
export default interface CategoryContainer {
    readonly content: HTMLElement;
    readonly trackContainers: TrackContainer[];
    readonly onHighlightChange: SealedEvent<TrackFragment[]>;
    addData(): void;
    getMarkedTrackFragments(): TrackFragment[];
    getHighlightedTrackFragments(): TrackFragment[];
    clearHighlightedTrackFragments(): void;
    getFirstTrackContainerWithStructureInfo(): TrackContainer | undefined;
}
