import d3 = require("d3");

import ColorConvert from "color-convert";
import { ElementWithData } from "./renderers/basic-track-renderer";

const loadComponent = function (name: string, className: CustomElementConstructor) {
    if (!customElements.get(name)) {
        customElements.define(name, className);
    }
};

function createRow(label: Node, content: Node, customClass: string = "", arrow: boolean = false) {
    const labelWrapper = d3.create("span").attr("title", label.textContent ?? "").node()!;
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
async function fetchWithTimeout(resource: string, options: RequestInitWithTimeOut) {
    const { timeout = 8000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);

    return response;
}
function getClickedTrackFragments() {
    return d3.selectAll('.fragment-group.clicked').nodes().map(fragment => {
        const fragmentData = (fragment as ElementWithData).__data__;
        return { start: fragmentData.start, end: fragmentData.end, color: fragmentData.color }
    });
}
interface RequestInitWithTimeOut extends RequestInit {
    timeout: number;
}
export {
    loadComponent, createRow, getDarkerColor, groupBy, groupByAndMap, fetchWithTimeout, getClickedTrackFragments
};