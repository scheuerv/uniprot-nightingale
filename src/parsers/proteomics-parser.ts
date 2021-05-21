import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from './track-parser';
import BasicTrackRenderer, { Fragment, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
import FragmentAligner from './fragment-aligner';
import { getDarkerColor } from '../utils';
import { config as trackConfig } from "protvista-track/src/config";
import { createFeatureTooltip } from '../tooltip-content';

export default class ProteomicsParser implements TrackParser {
    private readonly categoryLabel = "Proteomics";
    public readonly categoryName = "PROTEOMICS";
    private readonly unique = "UNIQUE";
    private readonly nonUnique = "NON_UNIQUE";
    public async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer[] | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const uniqueFragmentAligner = new FragmentAligner();
        const nonUniqueFragmentAligner = new FragmentAligner();
        const features = data.features;
        const colorUnique = trackConfig[this.unique].color;
        const colorNonUnique = trackConfig[this.nonUnique].color;
        const borderColorUnique = getDarkerColor(colorUnique);
        const borderColorNonUnique = getDarkerColor(colorNonUnique);
        let id = 1;
        features.forEach(feature => {
            if (feature.unique) {
                uniqueFragmentAligner.addFragment(new Fragment(id++, parseInt(feature.begin), parseInt(feature.end), borderColorUnique, colorUnique, trackConfig[this.unique]?.shape, createFeatureTooltip(feature, uniprotId, data.sequence, this.unique)));
            }
            else {
                nonUniqueFragmentAligner.addFragment(new Fragment(id++, parseInt(feature.begin), parseInt(feature.end), borderColorNonUnique, colorNonUnique, trackConfig[this.nonUnique]?.shape, createFeatureTooltip(feature, uniprotId, data.sequence, this.nonUnique)));
            }
        });
        const trackRows = new Map([
            [this.unique, new TrackRow(uniqueFragmentAligner.getAccessions(), trackConfig[this.unique].label)],
            [this.nonUnique, new TrackRow(nonUniqueFragmentAligner.getAccessions(), trackConfig[this.nonUnique].label)]
        ]);
        if (trackRows.size > 0) {
            return [new BasicTrackRenderer(trackRows, this.categoryLabel, true, this.categoryName)];
        }
        else {
            return null;
        }
    }
}