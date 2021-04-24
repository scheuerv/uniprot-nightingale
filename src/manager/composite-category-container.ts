import { createEmitter } from "ts-typed-events";
import CategoryContainer from "./category-container";
import { TrackFragment } from "./track-manager";

export default class CompositeCategoryContainer implements CategoryContainer {
    private readonly emitOnHighlightChange = createEmitter<TrackFragment[]>();
    public readonly onHighlightChange = this.emitOnHighlightChange.event;
    constructor(private readonly categoryContainers: CategoryContainer[]) {
        categoryContainers.forEach(categoryContainer => {
            categoryContainer.onHighlightChange.on(trackFragment => this.emitOnHighlightChange.emit(trackFragment))
        })
    }
    public getMarkedTrackFragments(): TrackFragment[] {
        return this.categoryContainers.flatMap(categoryContainer => categoryContainer.getMarkedTrackFragments());
    }
    public get trackContainers() {
        return this.categoryContainers.flatMap(categoryContainer => categoryContainer.trackContainers);
    }
    public get content() {
        const div = document.createElement("div");
        this.categoryContainers.forEach(categoryContainer => div.appendChild(categoryContainer.content));
        return div;

    }
    public addData(): void {
        this.categoryContainers.forEach(categoryContainer => categoryContainer.addData());
    }

}