import { getDarkerColor } from "../utils";
import { createFeatureTooltip } from "../tooltip-content";
import { Feature } from "protvista-feature-adapter/src/BasicHelper";
import { Fragment } from "../types/accession";
import { config as trackConfig } from "protvista-track/src/config";

export class FeatureFragmentConverter {
    constructor(private readonly dataSource?: string) {}

    public convert(
        id: number,
        sequence: string,
        uniprotId: string,
        processedFeature: Feature
    ): Fragment {
        const fillColor: string =
            processedFeature.color ?? trackConfig[processedFeature.type]?.color;
        const borderColor: string = getDarkerColor(fillColor);
        return new Fragment(
            id,
            parseInt(processedFeature.begin),
            parseInt(processedFeature.end),
            borderColor,
            fillColor,
            trackConfig[processedFeature.type]?.shape,
            createFeatureTooltip(processedFeature, uniprotId, sequence, this.dataSource, undefined)
        );
    }
}
