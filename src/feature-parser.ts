import BasicTrackRenderer, { Accession, Fragment, Location, TrackRow } from "./basic-track-renderer";
import CompositeTrackRenderer from "./composite-track-renderer";
import TrackParser from "./track-parser";
import trackRenderer from "./track-renderer";
const config = require("protvista-track/src/config").config;
export default class FeatureParser implements TrackParser {
    async parse(uniprotId: string, data: any): Promise<trackRenderer | null> {

        const categories: Map<string, Map<string, Accession[]>> = new Map();
        const features = data.features;
        features.forEach((feature: { category: string; begin: number; end: number; type: string; }) => {
            let category = categories.get(feature.category);
            if (!category) {
                category = new Map();
                categories.set(feature.category, category);
            }
            let type = category.get(feature.type)
            if (!type) {
                type = [];
                category.set(feature.type, type);
            }
            let accessions = categories.get(feature.category)?.get(feature.type)??[];
            let fragmentAdded=false;
            accessions.forEach(accession => {
                const fragments=accession.locations[0].fragments;
                if (!fragmentAdded&&fragments[fragments.length - 1].end < feature.begin)
                {
                    fragments.push(new Fragment(feature.begin, feature.end, '#000000', config[feature.type]?.color))
                    fragmentAdded=true;
                }
            });
            if(!fragmentAdded)
            {
                accessions.push(new Accession(null,[new Location([new Fragment(feature.begin, feature.end, '#000000', config[feature.type]?.color)])],feature.type))
            }

        });
        const categoryRenderers: BasicTrackRenderer[] = [];
        for (let [category, categoryData] of categories.entries()) {
            const typeTrackRows: TrackRow[] = [];
            for (let [type, typeData] of categoryData) {
                typeTrackRows.push(new TrackRow(typeData, config[type]?.label ?? type));
            }
            categoryRenderers.push(new BasicTrackRenderer(typeTrackRows, category));
        }
        return new CompositeTrackRenderer(categoryRenderers);
    }

}