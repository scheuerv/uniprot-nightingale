import { SealedEvent } from "ts-typed-events";
import { TrackContainer } from "./track-container";
import { TrackFragment } from "./track-manager";

export default interface CategoryContainer {
    readonly content: HTMLElement;
    readonly trackContainers: TrackContainer[];
    readonly onHighlightChange: SealedEvent<TrackFragment[]>;
    addData(): void;
    getMarkedTrackFragments(): TrackFragment[];
    getHighlightedTrackFragments(): TrackFragment[];
    clearHighlightedTrackFragments(): void;
    getFirstTrackContainerWithOutput(): TrackContainer | undefined;

}