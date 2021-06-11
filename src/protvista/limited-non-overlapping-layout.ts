import NonOverlappingLayout from "protvista-track/src/NonOverlappingLayout";

export default class LimitedNonOverlappingLayout extends NonOverlappingLayout {
    public getFeatureHeight(): number {
        return Math.max(1, this._rowHeight - 2 * this._padding);
    }
}
