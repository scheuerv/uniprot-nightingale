import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from './track-parser';
import BasicTrackRenderer, { Fragment, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
import FragmentAligner from './fragment-aligner';
import { getDarkerColor } from '../utils';
const config = require("protvista-track/src/config").config;
import { createFeatureTooltip } from '../tooltip-content';

export default class ProteomicsParser implements TrackParser {
    private readonly categoryName = "Proteomics";
    private readonly unique = "UNIQUE";
    private readonly nonUnique = "NON_UNIQUE";
    public async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const uniqueFragmentAligner = new FragmentAligner();
        const nonUniqueFragmentAligner = new FragmentAligner();
        const features = data.features;
        const colorUnique = config[this.unique].color;
        const colorNonUnique = config[this.nonUnique].color;
        const borderColorUnique = getDarkerColor(colorUnique);
        const borderColorNonUnique = getDarkerColor(colorNonUnique);
        let id = 1;
        features.forEach(feature => {
            if (feature.unique) {
                uniqueFragmentAligner.addFragment(new Fragment(id++, parseInt(feature.begin), parseInt(feature.end), borderColorUnique, colorUnique, config[this.unique]?.shape, createFeatureTooltip(feature, uniprotId, this.unique)));
            }
            else {
                nonUniqueFragmentAligner.addFragment(new Fragment(id++, parseInt(feature.begin), parseInt(feature.end), borderColorNonUnique, colorNonUnique, config[this.nonUnique]?.shape, createFeatureTooltip(feature, uniprotId, this.nonUnique)));
            }
        });
        const trackRows = [
            new TrackRow(uniqueFragmentAligner.getAccessions(), config[this.unique].label),
            new TrackRow(nonUniqueFragmentAligner.getAccessions(), config[this.nonUnique].label)
        ];
        if (trackRows.length > 0) {
            return new BasicTrackRenderer(trackRows, this.categoryName, undefined, true);
        }
        else {
            return null;
        }
    }
}