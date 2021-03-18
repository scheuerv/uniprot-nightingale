import CategoryContainer from "./category-container";
import { TrackContainer } from "./track-container";
export default class BasicCategoryContainer implements CategoryContainer {
    constructor(private tracks: TrackContainer[], private categoryDiv: HTMLDivElement) {

    }
    getContent(): HTMLElement {
        return this.categoryDiv;
    }
    addData() {
        this.tracks.forEach(track => track.addData());
    }
}