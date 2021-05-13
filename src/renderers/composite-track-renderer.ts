
import CompositeCategoryContainer from "../manager/composite-category-container";
import TrackRenderer from "./track-renderer";

export default class CompositeTrackRenderer implements TrackRenderer {
    constructor(private readonly trackRenderers: TrackRenderer[], public readonly categoryName: string) {
    }
    public getCategoryContainer(sequence: string): CompositeCategoryContainer {
        return new CompositeCategoryContainer(this.trackRenderers.map(trackRenderer => trackRenderer.getCategoryContainer(sequence)));
    }

}