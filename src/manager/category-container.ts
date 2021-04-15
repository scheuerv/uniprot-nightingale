import { TrackContainer } from "./track-container";

export default interface CategoryContainer {
    content: HTMLElement;
    trackContainers: TrackContainer[];
    addData(): void;
}