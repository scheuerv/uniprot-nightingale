import { TrackFragment } from "../manager/track-manager";
import { createEmitter } from "ts-typed-events";
import CompositeCategoryContainer from "../manager/composite-category-container";
import TrackRenderer from "./track-renderer";

export default class CompositeTrackRenderer implements TrackRenderer {
    private emitOnArrowClick = createEmitter<TrackFragment[]>();
    public onArrowClick = this.emitOnArrowClick.event;
    constructor(private readonly trackRenderers: TrackRenderer[]) {
        trackRenderers.forEach(trackRenderer => trackRenderer.onArrowClick.on(features =>
            this.emitOnArrowClick.emit(features)
        ))
    }
    getCategoryContainer(sequence: string): CompositeCategoryContainer {
        return new CompositeCategoryContainer(this.trackRenderers.map(trackRenderer => trackRenderer.getCategoryContainer(sequence)));
    }

}