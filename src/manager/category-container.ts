import { TrackContainer } from "./track-container";

export default interface CategoryContainer {
    getContent(): HTMLElement;
    addData(): void;
    getTrackContainers(): TrackContainer[];
}