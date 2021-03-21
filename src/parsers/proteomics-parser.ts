import TrackParser from './track-parser';
import BasicTrackRenderer, { Fragment, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
import FragmentAligner from './fragment-aligner';
import { getDarkerColor } from '../utils';
const config = require("protvista-track/src/config").config;
import { createEmitter } from "ts-typed-events";

export default class ProteomicsParser implements TrackParser<ProteomicsOutput> {
    private categoryName = "Proteomics";
    private emitDataLoaded = createEmitter<ProteomicsOutput[]>();
    public readonly dataLoaded = this.emitDataLoaded.event;
    async parse(uniprotId: string, data: any): Promise<TrackRenderer | null> {
        if (data.errorMessage) {
            return null;
        }

        const uniqueFragmentAligner = new FragmentAligner('UNIQUE');
        const nonUniqueFragmentAligner = new FragmentAligner('NON_UNIQUE');
        const features = data.features;
        const colorUnique = config[uniqueFragmentAligner.getType()].color;
        const colorNonUnique = config[nonUniqueFragmentAligner.getType()].color;
        const borderColorUnique = getDarkerColor(colorUnique);
        const borderColorNonUnique = getDarkerColor(colorNonUnique);
        features.forEach((feature: { unique: string; begin: string; end: string; }) => {
            if (feature.unique) {
                uniqueFragmentAligner.addFragment(new Fragment(parseInt(feature.begin), parseInt(feature.end), borderColorUnique, colorUnique));
            }
            else {
                nonUniqueFragmentAligner.addFragment(new Fragment(parseInt(feature.begin), parseInt(feature.end), borderColorNonUnique, colorNonUnique));
            }
        });
        const trackRows = [
            new TrackRow(uniqueFragmentAligner.getAccessions(), config[uniqueFragmentAligner.getType()].label),
            new TrackRow(nonUniqueFragmentAligner.getAccessions(), config[nonUniqueFragmentAligner.getType()].label)
        ];
        this.emitDataLoaded.emit([{}]);
        if (trackRows.length > 0) {
            return new BasicTrackRenderer(trackRows, this.categoryName);
        }
        else {
            return null;
        }
    }
}
type ProteomicsOutput = {};