import ProtvistaVariation from "protvista-variation";
import d3 = require('d3');

export default class FixedProtvistaVariation extends ProtvistaVariation {
    public connectedCallback() {
        super.connectedCallback();
        this.zoom.filter(function () {
            return !d3.event.button && d3.event.type != "dblclick";
        });
    }
}