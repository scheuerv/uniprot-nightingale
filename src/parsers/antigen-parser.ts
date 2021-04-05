import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from './track-parser';
import BasicTrackRenderer, { Fragment, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
import { config } from "protvista-track/src/config";
import { getDarkerColor, groupBy } from '../utils';

import { createEmitter } from "ts-typed-events";
import FragmentAligner from './fragment-aligner';
import { createTooltip } from '../tooltip-content';
export default class AntigenParser implements TrackParser<AntigenOutput>  {

    private readonly emitOnDataLoaded = createEmitter<AntigenOutput[]>();
    public readonly onDataLoaded = this.emitOnDataLoaded.event;
    private readonly categoryName = "Antigenic sequences";
    async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer | null> {
        if (isErrorResponse(data)) {
            this.emitOnDataLoaded.emit([]);
            return null;
        }
        const features = groupBy(data.features, feature => feature.type);
        this.emitOnDataLoaded.emit([]);

        if (features.size > 0) {
            const trackRows: TrackRow<AntigenOutput>[] = [];
            features.forEach((typeFeatures, type) => {
                const fillColor = config[type]?.color;
                const borderColor = getDarkerColor(fillColor)
                let fragmentAligner = new FragmentAligner();
                typeFeatures.forEach(feature => {
                    fragmentAligner.addFragment(new Fragment(parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor, config[feature.type]?.shape, createTooltip(feature, uniprotId, data.sequence)));
                })
                trackRows.push(new TrackRow(fragmentAligner.getAccessions(), config[type]?.label));

            });
            return new BasicTrackRenderer(trackRows, this.categoryName, undefined, true);
        } else {
            return null;
        }
    }
}
type AntigenOutput = {};