import BasicTrackRenderer, { Fragment, TrackRow } from "../renderers/basic-track-renderer";
import CompositeTrackRenderer from "../renderers/composite-track-renderer";
import FragmentAligner from "./fragment-aligner";
import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from "./track-parser";
import TrackRenderer from "../renderers/track-renderer";
import { config } from "protvista-track/src/config";
import { getDarkerColor, } from "../utils";
import { createFeatureTooltip } from "../tooltip-content";
import { createEmitter } from "ts-typed-events";
export default class FeatureParser implements TrackParser<FeatureOutput> {
    private readonly emitOnDataLoaded = createEmitter<FeatureOutput[]>();
    public readonly onDataLoaded = this.emitOnDataLoaded.event;
    failDataLoaded(): void {
        this.emitOnDataLoaded.emit([]);
    }
    async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer | null> {
        if (isErrorResponse(data)) {
            this.emitOnDataLoaded.emit([]);
            return null;
        }
        const categories: Map<string, Map<string, FragmentAligner>> = new Map();
        const features = data.features;
        let id = 1;
        features.forEach(feature => {
            if (feature.category) {
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
                const fillColor = config[feature.type]?.color;
                const borderColor = getDarkerColor(fillColor);
                typeFeatureFragmentAligner.addFragment(new Fragment(id++, parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor, config[feature.type]?.shape, createFeatureTooltip(feature, uniprotId, data.sequence)));
            }
        });
        const categoryRenderers: BasicTrackRenderer<FeatureOutput>[] = [];
        for (const [category, categoryData] of categories.entries()) {
            const typeTrackRows: TrackRow<FeatureOutput>[] = [];
            for (const [type, fragmentAligner] of categoryData) {
                typeTrackRows.push(new TrackRow(fragmentAligner.getAccessions(), config[type]?.label ?? type));
            }
            categoryRenderers.push(new BasicTrackRenderer(typeTrackRows, categoriesConfig[category]?.label ? categoriesConfig[category]?.label : this.createLabel(category), undefined, true));
        }
        this.emitOnDataLoaded.emit([])
        if (categories.size > 0) {
            return new CompositeTrackRenderer(categoryRenderers);
        }
        else {
            return null;
        }
    }

    createLabel(category: string) {
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

type FeatureOutput = {};


