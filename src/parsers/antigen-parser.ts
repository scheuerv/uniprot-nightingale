import TrackParser, { ErrorResponse, isErrorResponse, ProteinFeatureInfo } from './track-parser';
import BasicTrackRenderer, { Fragment, Location, Accession, TrackRow } from '../renderers/basic-track-renderer';
import TrackRenderer from '../renderers/track-renderer';
import { config } from "protvista-track/src/config";
import { getDarkerColor } from '../utils';

import { createEmitter } from "ts-typed-events";
export default class AntigenParser implements TrackParser<AntigenOutput>  {

    private readonly emitOnDataLoaded = createEmitter<AntigenOutput[]>();
    public readonly onDataLoaded = this.emitOnDataLoaded.event;
    private readonly categoryName = "Antigenic sequences";
    async parse(uniprotId: string, data: ProteinFeatureInfo | ErrorResponse): Promise<TrackRenderer | null> {
        if (isErrorResponse(data)) {
            this.emitOnDataLoaded.emit([]);
            return null;
        }
        const features = data.features;
        const fragments = features.map(feature => {
            const fillColor = config[feature.type]?.color;
            const borderColor = getDarkerColor(fillColor)
            return new Fragment(parseInt(feature.begin), parseInt(feature.end), borderColor, fillColor,config[feature.type]?.shape)
        });
        this.emitOnDataLoaded.emit([]);
        if (features.length > 0) {
            const type = features[0].type;
            const trackRow = new TrackRow([
                new Accession(null, [new Location(fragments)], type),
            ], config[type]?.label);
            return new BasicTrackRenderer([trackRow], this.categoryName, undefined);
        } else {
            return null;
        }
    }
}
type AntigenOutput = {};