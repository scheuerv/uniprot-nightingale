// @ts-ignore
import ProtvistaTrack from "protvista-track";
import LimitedNonOverlappingLayout from "./limited-non-overlapping-layout";
// @ts-ignore
import DefaultLayout from "protvista-track/src/DefaultLayout";


export default class LimitedTrack extends ProtvistaTrack {
  getLayout() {
    // @ts-ignore
    if (String(this.getAttribute("layout")).toLowerCase() === "non-overlapping")
      // @ts-ignore
      return new LimitedNonOverlappingLayout({
        // @ts-ignore
        layoutHeight: this._height,
      });
    return new DefaultLayout({
      // @ts-ignore
      layoutHeight: this._height,
    });
  }
}