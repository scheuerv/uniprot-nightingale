import d3 = require("d3");

import ColorConvert from "color-convert";

const loadComponent = function (name: string, className: CustomElementConstructor) {
    if (!customElements.get(name)) {
        customElements.define(name, className);
    }
};

function createRow(label: Node, content: Node, customClass: string = "", arrow: boolean = false) {
    const labelWrapper = d3.create("span").node()!;
    if (arrow) {
        labelWrapper.appendChild(d3.create("i").attr("class", "fas fa-arrow-circle-right").node()!);
    }
    labelWrapper.appendChild(label);
    const row = d3.create("div")
        .attr("class", "track-row");
    row.append("div").attr("class", "track-label " + customClass).node()?.appendChild(labelWrapper);
    row.append("div").attr("class", "track-content " + customClass).node()?.appendChild(content);
    return row;
}

function unmarkArrows() {
    d3.selectAll(".fa-arrow-circle-right.clicked").nodes().forEach(node => {
        (node as Element).classList.remove("clicked");
    });
}
function markArrow() {
    const classList = d3.select(d3.event.target).node().classList;
    if (classList.contains("clicked")) {
        unmarkArrows();
        return false;
    } else {
        unmarkArrows()
        classList.add("clicked");
        return true;
    }
}
function getDarkerColor(color: string | undefined) {
    if (!color) {
        return "#000000";
    }
    const hsv = ColorConvert.hex.hsv(color);
    if (hsv) {
        hsv[2] = hsv[2] * 0.8;
        return '#' + ColorConvert.hsv.hex(hsv);
    }
    return "#000000";
}

function groupBy<T, Id>(data: IterableIterator<T> | T[], by: (item: T) => Id): Map<Id, T[]> {
    return groupByAndMap(data, by, i => i);
}

function groupByAndMap<T, O, Id>(data: IterableIterator<T> | T[], by: (item: T) => Id, transform: (item: T) => O): Map<Id, O[]> {
    let grouped: Map<Id, O[]> = new Map();
    for (let item of data) {
        const id = by(item);
        const source = transform(item);
        if (grouped.get(id)) {
            grouped.get(id)?.push(source);
        } else {
            grouped.set(id, [source]);
        }
    }
    return grouped;
}
export { loadComponent, createRow, getDarkerColor, groupBy, groupByAndMap, markArrow };