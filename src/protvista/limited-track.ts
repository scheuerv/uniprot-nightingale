import ProtvistaTrack from "protvista-track";
import LimitedNonOverlappingLayout from "./limited-non-overlapping-layout";
import DefaultLayout from "protvista-track/src/DefaultLayout";
import * as d3 from "d3";

/**
 * ProtvistaTrack which is using fixed LimitedNonOverlappingLayout.
 * It also disables zooming on double click, which caused random issues
 * when zooming.
 */
export default class LimitedTrack extends ProtvistaTrack {
    public getLayout(): DefaultLayout {
        if (String(this.getAttribute("layout")).toLowerCase() === "non-overlapping")
            return new LimitedNonOverlappingLayout({
                layoutHeight: this.height
            });
        return new DefaultLayout({
            layoutHeight: this.height
        });
    }

    public connectedCallback(): void {
        super.connectedCallback();
        this.zoom.filter(function () {
            return !d3.event.button && d3.event.type != "dblclick";
        });
    }
}
