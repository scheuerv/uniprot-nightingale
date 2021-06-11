import ProtvistaTrack from "protvista-track";
import LimitedNonOverlappingLayout from "./limited-non-overlapping-layout";
import DefaultLayout from "protvista-track/src/DefaultLayout";
import d3 = require("d3");

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
