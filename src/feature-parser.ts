import BasicTrackRenderer, { Fragment, TrackRow } from "./basic-track-renderer";
import CompositeTrackRenderer from "./composite-track-renderer";
import FragmentAligner from "./fragment-aligner";
import TrackParser from "./track-parser";
import TrackRenderer from "./track-renderer";
//@ts-ignore
import { config } from "protvista-track/src/config";
import { getDarkerColor } from "./utils";
export default class FeatureParser implements TrackParser {
    async parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {

        const categories: Map<string, Map<string, FragmentAligner>> = new Map();
        const features = data.features;
        features.forEach((feature: { category: string; begin: string; end: string; type: string; }) => {
            let category = categories.get(feature.category);
            if (!category) {
                category = new Map();
                categories.set(feature.category, category);
            }
            let typeFeatureAligner = category.get(feature.type)
            if (!typeFeatureAligner) {
                typeFeatureAligner = new FragmentAligner(feature.type);
                category.set(feature.type, typeFeatureAligner);
            }
            const fillColor = config[feature.type]?.color;
            const borderColor = getDarkerColor(fillColor);

            typeFeatureAligner.addFragment(new Fragment(parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor));


        });
        const categoryRenderers: BasicTrackRenderer[] = [];
        for (const [category, categoryData] of categories.entries()) {
            const typeTrackRows: TrackRow[] = [];
            for (const [type, fragmentAligner] of categoryData) {
                typeTrackRows.push(new TrackRow(fragmentAligner.getAccessions(), config[type]?.label ?? type));
            }
            categoryRenderers.push(new BasicTrackRenderer(typeTrackRows, category));
        }
        if (categories.size > 0) {
            return new CompositeTrackRenderer(categoryRenderers);
        }
        else {
            return null;
        }
    }

}