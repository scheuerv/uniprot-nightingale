import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from './track-parser';
import BasicTrackRenderer, { Fragment, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
import FragmentAligner from './fragment-aligner';
import { getDarkerColor } from '../utils';
const config = require("protvista-track/src/config").config;
import { createEmitter } from "ts-typed-events";

export default class ProteomicsParser implements TrackParser<ProteomicsOutput> {
    private readonly categoryName = "Proteomics";
    private readonly emitOnDataLoaded = createEmitter<ProteomicsOutput[]>();
    public readonly onDataLoaded = this.emitOnDataLoaded.event;
    async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer | null> {      
        if (isErrorResponse(data)) {
            this.emitOnDataLoaded.emit([]);
            return null;
        }
        const uniqueFragmentAligner = new FragmentAligner('UNIQUE');
        const nonUniqueFragmentAligner = new FragmentAligner('NON_UNIQUE');
        const features = data.features;
        const colorUnique = config[uniqueFragmentAligner.getType()].color;
        const colorNonUnique = config[nonUniqueFragmentAligner.getType()].color;
        const borderColorUnique = getDarkerColor(colorUnique);
        const borderColorNonUnique = getDarkerColor(colorNonUnique);
        features.forEach(feature => {
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
        this.emitOnDataLoaded.emit([]);
        if (trackRows.length > 0) {
            return new BasicTrackRenderer(trackRows, this.categoryName,undefined);
        }
        else {
            return null;
        }
    }
}
type ProteomicsOutput = {};