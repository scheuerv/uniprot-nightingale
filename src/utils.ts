import d3 = require("d3");

//@ts-ignore
import ColorConvert from "color-convert";

const loadComponent = function(name: string, className: CustomElementConstructor) {
    if (!customElements.get(name)) {
        customElements.define(name, className);
    }
};

function createRow(label: Node, content: Node, customClass: string = "") {
    const row = d3.create("div")
        .attr("class", "track-row");
    row.append("div").attr("class", "track-label " + customClass).node()?.appendChild(label);
    row.append("div").attr("class", "track-content " + customClass).node()?.appendChild(content);
    return row;
}

function getDarkerColor(color:string|undefined)
{
    if(!color)
    {
        return "#000000";
    }
    const hsv = ColorConvert.hex.hsv(color);
    if (hsv) {
        hsv[2] = hsv[2] * 0.8;
        return '#' + ColorConvert.hsv.hex(hsv);
    }
    return "#000000";
}
export { loadComponent, createRow,getDarkerColor };