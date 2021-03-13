// @ts-ignore
import NonOverlappingLayout from "protvista-track/src/NonOverlappingLayout";

export default class LimitedNonOverlappingLayout extends NonOverlappingLayout {
    getFeatureHeight() {
        // @ts-ignore
        return Math.max(1,this._rowHeight - 2 * this._padding);
      }
}