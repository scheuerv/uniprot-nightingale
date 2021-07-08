import $ from "jquery";
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
    label: JQuery<Text> | JQuery<HTMLElement>,
    content: JQuery<HTMLElement>,
    customClass = "",
    arrow = false
): JQuery<HTMLElement> {
    const labelWrapper = $("<span/>").attr("title", label.text());
    if (arrow) {
        labelWrapper.append($("<i/>", { class: "fas fa-arrow-circle-right" }));
    }
    return $("<div/>")
        .addClass("track-row")
        .append(
            $("<div/>")
                .addClass("track-label " + customClass)
                .append(labelWrapper.append(label))
        )
        .append(
            $("<div/>")
                .addClass("track-content " + customClass)
                .append(content)
        );
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
