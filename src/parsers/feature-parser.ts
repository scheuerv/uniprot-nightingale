import BasicTrackRenderer, { Fragment, TrackRow } from "../renderers/basic-track-renderer";
import FragmentAligner from "./fragment-aligner";
import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from "./track-parser";
import TrackRenderer from "../renderers/track-renderer";
import { config as trackConfig } from "protvista-track/src/config";
import { getDarkerColor, } from "../utils";
import { createFeatureTooltip } from "../tooltip-content";
export default class FeatureParser implements TrackParser {
    public readonly categoryName = "FEATURES";
    constructor(private readonly exclusions?: string[]) {

    }
    public async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const categories: Map<string, Map<string, FragmentAligner>> = new Map();
        const features = data.features;
        let id = 1;
        features.forEach(feature => {
            if (feature.category && !this.exclusions?.includes(feature.category)) {
                let category = categories.get(feature.category);
                if (!category) {
                    category = new Map();
                    categories.set(feature.category, category);
                }
                let typeFeatureFragmentAligner = category.get(feature.type)
                if (!typeFeatureFragmentAligner) {
                    typeFeatureFragmentAligner = new FragmentAligner();
                    category.set(feature.type, typeFeatureFragmentAligner);
                }
                const fillColor = feature.color ?? trackConfig[feature.type]?.color;
                const borderColor = getDarkerColor(fillColor);
                typeFeatureFragmentAligner.addFragment(new Fragment(id++, parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor, trackConfig[feature.type]?.shape, createFeatureTooltip(feature, uniprotId, data.sequence)));
            }
        });
        const categoryRenderers: BasicTrackRenderer[] = [];
        for (const [category, categoryData] of categories.entries()) {
            const typeTrackRows: Map<string, TrackRow> = new Map();
            for (const [type, fragmentAligner] of categoryData) {
                typeTrackRows.set(type, new TrackRow(fragmentAligner.getAccessions(), trackConfig[type]?.label ?? this.createLabel(type)));
            }
            categoryRenderers.push(new BasicTrackRenderer(typeTrackRows, categoriesConfig[category]?.label ? categoriesConfig[category]?.label : this.createLabel(category), true, category));
        }
        if (categories.size > 0) {
            return categoryRenderers;
        }
        else {
            return null;
        }
    }

    private createLabel(category: string) {
        category = category[0].toUpperCase() + category.slice(1, category.length).replace(/_/g, ' ').toLowerCase();
        return category;
    }

}
const categoriesConfig: Record<string, { readonly label: string }> = {
    "DOMAINS_AND_SITES": {
        "label": "Domains & sites"
    },
    "MOLECULE_PROCESSING": {
        "label": "Molecule processing"
    },
    "PTM": {
        "label": "PTM"
    },
    "SEQUENCE_INFORMATION": {
        "label": "Sequence information"
    },
    "STRUCTURAL": {
        "label": "Structural features"
    },
    "MUTAGENESIS": {
        "label": "Mutagenesis"
    },
    "VARIANTS": {
        "label": "Variants"
    }
}


