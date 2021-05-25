import d3 = require("d3");

import ColorConvert from "color-convert";
import { Association, SourceType } from "protvista-variation-adapter/dist/es/variants";
import { OtherSourceData, VariantWithSources } from "./parsers/variation-parser";
import { VariantColors } from "./protvista/variation-filter";

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
interface RequestInitWithTimeOut extends RequestInit {
    timeout: number;
}
function existAssociation(association: Association[] | undefined): boolean {
    if (association) {
        if (association.length !== 0) {
            if (association[0].name || association[0].description) {
                return true;
            }
        }
    }
    return false;
};


function variantsFill(variant: VariantWithSources, newSources?: Record<string, OtherSourceData>, overwritePredictions?: boolean): string {
    if ((variant.alternativeSequence === '*')) {
        return VariantColors.othersColor;
    } else if ((variant.sourceType === SourceType.UniProt) ||
        (variant.sourceType === SourceType.Mixed)) {
        if (existAssociation(variant.association)) {
            return VariantColors.UPDiseaseColor;
        } else {
            return VariantColors.UPNonDiseaseColor;
        }
    } else if (variant.sourceType === SourceType.LargeScaleStudy && existAssociation(variant.association)) {
        return VariantColors.UPDiseaseColor;
    } else {
        let externalPrediction: number | undefined;
        let extDatum: OtherSourceData | undefined = undefined;
        if (newSources) {
            for (const source in newSources) {
                const data = newSources[source];
                externalPrediction = getPredictionColorScore(data);
                extDatum = data;
                break;
            }

        }
        const predictionScore = getPredictionColorScore(variant);
        if (!variant.sourceType && !externalPrediction && !variant.consequenceType) {
            return '#000000';
        }
        if (variant.sourceType === SourceType.LargeScaleStudy && predictionScore === undefined) {
            return VariantColors.unknownColor;
        }
        return getVariantsFillColor(predictionScore, extDatum, externalPrediction, overwritePredictions);

    }
}

function getPredictionColorScore(variant: OtherSourceData): number | undefined {
    let polyphenPrediction: undefined | string;
    let polyphenScore = 0;
    let siftPrediction: undefined | string;
    let siftScore = 0;
    if (variant.predictions) {
        variant.predictions.forEach(function (prediction) {
            if (prediction.predAlgorithmNameType == 'PolyPhen') {
                polyphenPrediction = prediction.predictionValType;
                polyphenScore = prediction.score;
            } else if (prediction.predAlgorithmNameType == 'SIFT') {
                siftPrediction = prediction.predictionValType;
                siftScore = prediction.score;
            }
        })
    }
    var sift = false,
        polyphen = false;
    if ((polyphenPrediction !== undefined) && (polyphenPrediction !== 'unknown')) {
        polyphen = polyphenScore !== undefined ? true : false;
    }
    if (siftPrediction !== undefined) {
        sift = siftScore !== undefined ? true : false;
    }
    if (sift && polyphen) {
        return (siftScore + (1 - polyphenScore)) / 2;
    } else if (sift && !polyphen) {
        return siftScore;
    } else if (!sift && polyphen) {
        return 1 - polyphenScore;
    } else if (polyphenPrediction === 'unknown') {
        return 1;
    } else {
        return undefined;
    }
};

function getVariantsFillColor(predictionScore: number | undefined, extDatum: OtherSourceData | undefined, externalPredictionScore: number | undefined, overwritePredictions?: boolean) {
    if (overwritePredictions) {
        if (externalPredictionScore !== undefined) {
            return VariantColors.getPredictionColor(externalPredictionScore);
        } else if (predictionScore !== undefined) {
            return VariantColors.getPredictionColor(predictionScore);
        }
    } else {
        if (predictionScore !== undefined) {
            return VariantColors.getPredictionColor(predictionScore);
        } else if (externalPredictionScore !== undefined) {
            return VariantColors.getPredictionColor(externalPredictionScore);
        }
    }
    return VariantColors.othersColor;
};


export {
    loadComponent, createRow, getDarkerColor, groupBy, groupByAndMap, fetchWithTimeout, existAssociation, variantsFill
};