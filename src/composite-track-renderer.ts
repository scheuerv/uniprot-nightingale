import CompositeCategoryContainer from "./composite-category-container";
import TrackRenderer from "./track-renderer";

export default class CompositeTrackRenderer implements TrackRenderer {
    constructor(private trackRenderers: TrackRenderer[]) {

    }
    getCategoryContainer(sequence: string): CompositeCategoryContainer {
        return new CompositeCategoryContainer(this.trackRenderers.map(trackRenderer => trackRenderer.getCategoryContainer(sequence)));
    }

}