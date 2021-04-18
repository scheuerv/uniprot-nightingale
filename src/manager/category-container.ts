import { SealedEvent } from "ts-typed-events";
import { TrackContainer } from "./track-container";
import { TrackFragment } from "./track-manager";

export default interface CategoryContainer {
    content: HTMLElement;
    trackContainers: TrackContainer[];
    onHighlightChange: SealedEvent<TrackFragment[]>;
    addData(): void;
    getMarkedTrackFragments(): TrackFragment[];
}