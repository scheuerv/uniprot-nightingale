import * as d3 from "d3";
import ColorConvert from "color-convert";
import { HSV } from "color-convert/conversions";

interface RequestInitWithTimeOut extends RequestInit {
    timeout: number;
}

export function loadComponent(name: string, className: CustomElementConstructor): void {
    if (!customElements.get(name)) {
        customElements.define(name, className);
    }
}

export function createRow(
    label: Node,
    content: Node,
    customClass = "",
    arrow = false
): d3.Selection<HTMLDivElement, undefined, null, undefined> {
    const labelWrapper: HTMLSpanElement = d3
        .create("span")
        .attr("title", label.textContent ?? "")
        .node()!;
    if (arrow) {
        labelWrapper.appendChild(d3.create("i").attr("class", "fas fa-arrow-circle-right").node()!);
    }
    labelWrapper.appendChild(label);
    const row = d3.create("div").attr("class", "track-row");
    row.append("div")
        .attr("class", "track-label " + customClass)
        .node()
        ?.appendChild(labelWrapper);
    row.append("div")
        .attr("class", "track-content " + customClass)
        .node()
        ?.appendChild(content);
    return row;
}

export function getDarkerColor(color: string | undefined): string {
    if (!color) {
        return "#000000";
    }
    const hsv: HSV = ColorConvert.hex.hsv(color);
    if (hsv) {
        hsv[2] = hsv[2] * 0.8;
        return "#" + ColorConvert.hsv.hex(hsv);
    }
    return "#000000";
}

export function groupBy<T, Id>(data: IterableIterator<T> | T[], by: (item: T) => Id): Map<Id, T[]> {
    return groupByAndMap(data, by, (i) => i);
}

export function groupByAndMap<T, O, Id>(
    data: IterableIterator<T> | T[],
    by: (item: T) => Id,
    transform: (item: T) => O
): Map<Id, O[]> {
    const grouped: Map<Id, O[]> = new Map();
    for (const item of data) {
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

export async function fetchWithTimeout(
    resource: string,
    options: RequestInitWithTimeOut
): Promise<Response> {
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
