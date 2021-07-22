import NonOverlappingLayout from "protvista-track/src/NonOverlappingLayout";

/**
 * Fixes standard NonOverlappingLayout so the method getFeatureHeight()
 *  cannot return nonpositive number.
 */
export default class LimitedNonOverlappingLayout extends NonOverlappingLayout {
    public getFeatureHeight(): number {
        return Math.max(1, this._rowHeight - 2 * this._padding);
    }
}
