import ProtvistaTrack from "protvista-track";
import LimitedNonOverlappingLayout from "./limited-non-overlapping-layout";
import DefaultLayout from "protvista-track/src/DefaultLayout";


export default class LimitedTrack extends ProtvistaTrack {
  getLayout() {
    if (String(this.getAttribute("layout")).toLowerCase() === "non-overlapping")
      return new LimitedNonOverlappingLayout({
        layoutHeight: this._height,
      });
    return new DefaultLayout({
      layoutHeight: this._height,
    });
  }
}