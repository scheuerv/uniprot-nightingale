import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from './track-parser';
import BasicTrackRenderer, { Fragment, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
import { config } from "protvista-track/src/config";
import { getDarkerColor, groupBy } from '../utils';
import FragmentAligner from './fragment-aligner';
import { createFeatureTooltip } from '../tooltip-content';
export default class AntigenParser implements TrackParser {
    private readonly categoryName = "Antigenic sequences";
    public async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer | null> {
        if (isErrorResponse(data)) {
            return null;
        }
        const features = groupBy(data.features, feature => feature.type);
        if (features.size > 0) {
            const trackRows: TrackRow[] = [];
            let id = 1;
            features.forEach((typeFeatures, type) => {
                const fillColor = config[type]?.color;
                const borderColor = getDarkerColor(fillColor)
                const fragmentAligner = new FragmentAligner();
                typeFeatures.forEach(feature => {
                    fragmentAligner.addFragment(new Fragment(id++, parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor, config[feature.type]?.shape, createFeatureTooltip(feature, uniprotId, data.sequence)));
                })
                trackRows.push(new TrackRow(fragmentAligner.getAccessions(), config[type]?.label));

            });
            return new BasicTrackRenderer(trackRows, this.categoryName, true);
        } else {
            return null;
        }
    }
}