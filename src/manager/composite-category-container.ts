import CategoryContainer from "./category-container";
import { TrackContainer } from "./track-container";

export default class CompositeCategoryContainer implements CategoryContainer {
    constructor(private categoryContainers: CategoryContainer[]) {

    }
    getTrackContainers(): TrackContainer[] {
        return this.categoryContainers.flatMap(categoryContainer => categoryContainer.getTrackContainers())
    }
    getContent(): HTMLElement {
        const div = document.createElement("div");
        this.categoryContainers.forEach(categoryContainer => div.appendChild(categoryContainer.getContent()));
        return div;

    }
    addData(): void {
        this.categoryContainers.forEach(categoryContainer => categoryContainer.addData());
    }

}